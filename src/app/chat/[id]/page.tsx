"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { reportUser, blockUser } from "@/lib/firestore";
import { useAppStore } from "@/store";
import { Message } from "@/types";
import { ArrowLeft, Send, MoreVertical, Flag, ShieldOff } from "lucide-react";
import { format, isToday } from "date-fns";
import toast from "react-hot-toast";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const { firebaseUid } = useAppStore();

  const { match, messages, sending, matchLoading, error, other, otherId, send } =
    useChat(matchId);

  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect on access errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      router.replace("/matches");
    }
  }, [error, router]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      80
    );
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Clear input immediately for instant feel
    setInput("");

    const success = await send(text);
    if (!success) {
      // Restore input so the user doesn't lose what they typed
      setInput(text);
    }
  };

  const handleReport = async () => {
    if (!firebaseUid || !otherId) return;
    try {
      await reportUser(firebaseUid, otherId, "inappropriate", "Reported from chat");
      toast.success("User reported");
    } catch {
      toast.error("Failed to report");
    }
    setShowMenu(false);
  };

  const handleBlock = async () => {
    if (!firebaseUid || !otherId) return;
    try {
      await blockUser(firebaseUid, otherId);
      toast.success("User blocked");
      router.replace("/matches");
    } catch {
      toast.error("Failed to block user");
    }
  };

  /**
   * Format a message timestamp for display.
   * Handles null/undefined timestamps (e.g. optimistic messages whose
   * serverTimestamp() hasn't resolved yet).
   */
  const formatTime = (msg: Message): string => {
    if (!msg.timestamp) return "Sending…";
    try {
      const date = msg.timestamp.toDate();
      return isToday(date) ? format(date, "HH:mm") : format(date, "MMM d, HH:mm");
    } catch {
      return "";
    }
  };

  const isOptimistic = (msg: Message) =>
    typeof msg.id === "string" && msg.id.startsWith("optimistic-");

  // ── Loading state ──────────────────────────────────────────────────────────
  if (matchLoading) {
    return (
      <div className="min-h-dvh bg-metro-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-metro-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-metro-black flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-metro-dark border-b border-metro-border px-4 pt-12 pb-4 flex items-center gap-3 shrink-0">
        <button onClick={() => router.back()} className="text-metro-muted">
          <ArrowLeft size={22} />
        </button>

        <div className="flex-1">
          <h2 className="font-semibold text-white">{other?.name || "Chat"}</h2>
          <p className="text-xs text-emerald-400">Active on same route</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-metro-muted p-1"
          >
            <MoreVertical size={20} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-8 bg-metro-card border border-metro-border rounded-2xl overflow-hidden z-50 min-w-[160px] shadow-xl"
              >
                <button
                  onClick={handleReport}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-metro-border transition-colors text-sm text-orange-400"
                >
                  <Flag size={14} /> Report User
                </button>
                <button
                  onClick={handleBlock}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-metro-border transition-colors text-sm text-red-400"
                >
                  <ShieldOff size={14} /> Block User
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !matchLoading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-metro-muted text-sm">
              You matched with {other?.name}!
              <br />
              Say hello and start a conversation.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === firebaseUid;
          const pending = isOptimistic(msg);

          const showTime =
            i === messages.length - 1 ||
            (messages[i + 1]?.timestamp &&
              msg.timestamp &&
              messages[i + 1].timestamp.toMillis() - msg.timestamp.toMillis() >
                5 * 60 * 1000);

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm transition-opacity ${
                    isMe
                      ? "bg-metro-yellow text-metro-black rounded-br-md font-medium"
                      : "bg-metro-card border border-metro-border text-white rounded-bl-md"
                  } ${pending ? "opacity-60" : "opacity-100"}`}
                >
                  {msg.text}
                </div>
                {showTime && (
                  <span className="text-[10px] text-metro-muted px-1">
                    {formatTime(msg)}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <div className="bg-metro-dark border-t border-metro-border px-4 py-3 pb-safe shrink-0">
        <div className="flex gap-3 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && handleSend()
            }
            placeholder="Type a message…"
            className="flex-1 bg-metro-card border border-metro-border rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-metro-yellow transition-colors placeholder:text-metro-muted"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-12 h-12 rounded-2xl bg-metro-yellow flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-metro-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} className="text-metro-black" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
