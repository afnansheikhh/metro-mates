"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Timestamp } from "firebase/firestore";
import { subscribeToMessages, sendMessage, getMatch } from "@/lib/firestore";
import { useAppStore } from "@/store";
import { Message, Match } from "@/types";
import toast from "react-hot-toast";

interface UseChatReturn {
  match: Match | null;
  messages: Message[];
  sending: boolean;
  matchLoading: boolean;
  error: string | null;
  other: { name: string; photoURL?: string; email?: string } | null;
  otherId: string | undefined;
  send: (text: string) => Promise<boolean>;
}

export function useChat(matchId: string): UseChatReturn {
  const { user, firebaseUid } = useAppStore();
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [matchLoading, setMatchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track optimistic message IDs so we can deduplicate when the
  // real Firestore snapshot arrives.
  const optimisticIds = useRef<Set<string>>(new Set());

  // ── Load and validate match ──────────────────────────────────────────────────
  useEffect(() => {
    if (!matchId || !firebaseUid) return;

    setMatchLoading(true);
    setError(null);

    getMatch(matchId)
      .then((m) => {
        if (!m) {
          setError("Match not found");
          return;
        }
        if (!m.users.includes(firebaseUid)) {
          setError("Access denied");
          return;
        }
        setMatch(m);
      })
      .catch((err) => {
        console.error("[useChat] getMatch error:", err);
        setError("Failed to load conversation");
      })
      .finally(() => setMatchLoading(false));
  }, [matchId, firebaseUid]);

  // ── Real-time message subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!matchId || !firebaseUid) return;

    const unsub = subscribeToMessages(
      matchId,
      (serverMessages) => {
        setMessages((prev) => {
          // Keep optimistic messages that haven't yet been confirmed,
          // then append all server messages (which may overlap).
          const confirmedIds = new Set(serverMessages.map((m) => m.id));

          // Remove optimistic entries that the server has now confirmed
          optimisticIds.current.forEach((oid) => {
            if (confirmedIds.has(oid)) optimisticIds.current.delete(oid);
          });

          const stillOptimistic = prev.filter(
            (m) => m.id && optimisticIds.current.has(m.id)
          );

          // Merge: real messages first (ordered by server timestamp), then
          // any still-pending optimistic messages at the end.
          return [...serverMessages, ...stillOptimistic];
        });
      },
      (err) => {
        console.error("[useChat] messages subscription error:", err);
        // Only show a toast for permission / index errors; network hiccups
        // are retried automatically by the SDK.
        if (
          err.message?.includes("permission") ||
          err.message?.includes("index")
        ) {
          toast.error("Could not load messages. Please try again.");
        }
      }
    );

    return unsub;
  }, [matchId, firebaseUid]);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();

      if (!trimmed) return false;

      if (!firebaseUid) {
        toast.error("You are not signed in");
        return false;
      }

      if (!matchId) {
        toast.error("Invalid conversation");
        return false;
      }

      if (!match) {
        toast.error("Conversation not ready — please wait");
        return false;
      }

      // ── Optimistic update ──────────────────────────────────────────────────
      const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        matchId,
        senderId: firebaseUid,
        senderName: user?.name || "You",
        text: trimmed,
        // Use a local timestamp so the message sorts correctly before the
        // server timestamp resolves.
        timestamp: Timestamp.now(),
        read: false,
      };

      optimisticIds.current.add(optimisticId);
      setMessages((prev) => [...prev, optimisticMessage]);
      setSending(true);

      try {
        await sendMessage(matchId, firebaseUid, user?.name || "You", trimmed);
        return true;
      } catch (err) {
        // Roll back optimistic message
        optimisticIds.current.delete(optimisticId);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));

        console.error("[useChat] sendMessage error:", err);
        toast.error("Failed to send message");
        return false;
      } finally {
        setSending(false);
      }
    },
    [firebaseUid, matchId, match, user]
  );

  const otherId = match?.users.find((u) => u !== firebaseUid);
  const other = otherId ? (match?.userDetails[otherId] ?? null) : null;

  return { match, messages, sending, matchLoading, error, other, otherId, send };
}
