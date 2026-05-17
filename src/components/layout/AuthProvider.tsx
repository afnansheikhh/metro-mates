"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { subscribeToActiveTravelerCount } from "@/lib/firestore";
import { useAppStore } from "@/store";
import { useMatches } from "@/hooks/useMatches";

/**
 * Top-level provider that boots auth, traveler count, and — critically —
 * the matches subscription. Keeping the matches listener here means it
 * survives page navigation and new matches appear instantly everywhere.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth();
  useMatches(); // ← global real-time listener; keeps matches alive across pages

  const setActiveTravelers = useAppStore((s) => s.setActiveTravelers);

  useEffect(() => {
    const unsub = subscribeToActiveTravelerCount(setActiveTravelers);
    return unsub;
  }, [setActiveTravelers]);

  return <>{children}</>;
}