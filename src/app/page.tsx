"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function RootPage() {
  const { user, firebaseUid, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!firebaseUid) {
      router.replace("/auth/login");
    } else if (!user?.onboardingCompleted) {
      router.replace("/auth/onboarding");
    } else {
      router.replace("/home");
    }
  }, [user, firebaseUid, isLoading, router]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-metro-black">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-20 h-20 rounded-3xl bg-metro-yellow flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <span className="text-4xl">🚇</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-metro-yellow"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
