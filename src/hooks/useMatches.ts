"use client";

import { useEffect } from "react";
import { subscribeToMatches } from "@/lib/firestore";
import { useAppStore } from "@/store";

/**
 * Centralized hook for subscribing to the current user's matches via
 * a real-time Firestore listener. The listener keeps Zustand in sync so
 * matches are always current — even after a new match is created on the
 * swipe page — without any manual refresh.
 *
 * Call this ONCE at the top-level layout (AuthProvider) so the subscription
 * lives for the entire session. Calling it in individual pages causes the
 * listener to be torn down on navigation, which is why matches disappeared.
 */
export function useMatches() {
  const { firebaseUid, matches, setMatches } = useAppStore();

  useEffect(() => {
    if (!firebaseUid) {
      setMatches([]);
      return;
    }
    // Real-time listener — automatically picks up new matches created by swipe
    const unsub = subscribeToMatches(firebaseUid, setMatches);
    return unsub;
  }, [firebaseUid, setMatches]);

  return matches;
}