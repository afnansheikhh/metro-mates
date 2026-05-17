"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signInWithGoogle } from "@/lib/auth";
import { getUserDocument } from "@/lib/firestore";
import toast from "react-hot-toast";

// Google "G" SVG icon — no external image needed
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const FEATURES = [
  { icon: "🤝", title: "Network", desc: "Connect with professionals" },
  { icon: "🚇", title: "Commute", desc: "Same route, same vibe" },
  { icon: "💬", title: "Chat", desc: "Real-time conversations" },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { firebaseUser, isNewUser } = await signInWithGoogle();

      if (isNewUser) {
        toast.success("Welcome to MetroMates! 🚇");
        router.replace("/auth/onboarding");
      } else {
        // Returning user — check onboarding status
        const userDoc = await getUserDocument(firebaseUser.uid);
        if (userDoc?.onboardingCompleted) {
          toast.success(`Welcome back, ${userDoc.name?.split(" ")[0] || "there"}! 👋`);
          router.replace("/home");
        } else {
          router.replace("/auth/onboarding");
        }
      }
    } catch (err: any) {
      // User closed popup or other error
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        toast.error(err.message || "Sign-in failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-metro-black px-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-metro-yellow/5 blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 rounded-full bg-metro-yellow/3 blur-3xl" />
        <div className="absolute -bottom-20 right-10 w-48 h-48 rounded-full bg-metro-yellow/4 blur-2xl" />
      </div>

      {/* Hero section */}
      <div className="relative pt-20 pb-10 flex flex-col items-center text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: "backOut" }}
          className="w-24 h-24 rounded-[28px] bg-metro-yellow flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/25"
        >
          <span className="text-5xl">🚇</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Metro<span className="gradient-text">Mates</span>
          </h1>
          <p className="text-metro-muted text-base leading-relaxed max-w-xs mx-auto">
            Turn your daily commute into meaningful connections. Network, chat, and meet fellow travelers.
          </p>
        </motion.div>
      </div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative grid grid-cols-3 gap-3 mb-12"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.08 }}
            className="bg-metro-card border border-metro-border rounded-2xl p-3.5 text-center"
          >
            <div className="text-2xl mb-1.5">{f.icon}</div>
            <p className="text-white text-xs font-semibold mb-0.5">{f.title}</p>
            <p className="text-metro-muted text-[10px] leading-tight">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Auth section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="relative mt-auto pb-14 flex flex-col gap-4"
      >
        {/* Google Sign-in Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-[#1a1a1a] font-semibold text-base py-4 rounded-2xl shadow-lg shadow-black/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              <span>Signing you in…</span>
            </>
          ) : (
            <>
              <GoogleIcon size={20} />
              <span>Continue with Google</span>
            </>
          )}
        </motion.button>

        {/* Divider hint */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-metro-border" />
          <span className="text-metro-muted text-xs">secure · private · instant</span>
          <div className="flex-1 h-px bg-metro-border" />
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-6">
          {[
            { icon: "🔒", label: "End-to-end safe" },
            { icon: "🚫", label: "Not a dating app" },
            { icon: "⏱️", label: "Sessions expire" },
          ].map((badge) => (
            <div key={badge.label} className="flex flex-col items-center gap-1">
              <span className="text-base">{badge.icon}</span>
              <span className="text-[10px] text-metro-muted text-center leading-tight max-w-[64px]">
                {badge.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-metro-muted leading-relaxed">
          By continuing, you agree to our{" "}
          <span className="text-metro-yellow">Terms of Service</span>
          {" "}and{" "}
          <span className="text-metro-yellow">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}
