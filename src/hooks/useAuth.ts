"use client";

import { useEffect } from "react";
import { onAuthChange } from "@/lib/auth";
import { subscribeToUser } from "@/lib/firestore";
import { useAppStore } from "@/store";

export function useAuth() {
  const {
    user,
    firebaseUid,
    isLoading,
    setUser,
    setFirebaseUid,
    setLoading,
    clearMatches,
    setCurrentSession,
  } = useAppStore();

  useEffect(() => {
    const unsubAuth = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);
        const unsubUser = subscribeToUser(firebaseUser.uid, (userData) => {
          setUser(userData);
          setLoading(false);
        });
        return unsubUser;
      } else {
        // Clear ALL user-scoped state so no data leaks between accounts
        setFirebaseUid(null);
        setUser(null);
        clearMatches();
        setCurrentSession(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
    };
  }, [setUser, setFirebaseUid, setLoading, clearMatches, setCurrentSession]);

  return { user, firebaseUid, isLoading };
}
