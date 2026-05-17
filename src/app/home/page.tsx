"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppStore } from "@/store";
import { BottomNav } from "@/components/layout/BottomNav";
import { useMatches } from "@/hooks/useMatches";
import Link from "next/link";
import { Zap, Users, MessageCircle, TrendingUp } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const { user, firebaseUid, activeTravelers, currentSession } = useAppStore();
  const matches = useMatches();
  const router = useRouter();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const unreadMatches = matches.length;

  return (
    <div className="min-h-dvh bg-metro-black pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-metro-muted text-sm">{greeting()},</p>
            <h1 className="text-2xl font-bold text-white">
              {user?.name || "Traveler"} 👋
            </h1>
          </div>
          <Link href="/profile">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-metro-yellow/50 bg-metro-card flex items-center justify-center">
              {user?.photoURL ? (
                <Image src={user.photoURL} alt="Profile" width={44} height={44} className="object-cover w-full h-full" />
              ) : (
                <span className="text-xl">
                  {user?.name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Active Session Banner */}
      {currentSession && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mb-4"
        >
          <div className="bg-metro-yellow/10 border border-metro-yellow/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-metro-yellow text-xs font-semibold uppercase tracking-wider mb-1">Active Route</p>
              <p className="text-white text-sm font-medium">
                {currentSession.from} → {currentSession.to}
              </p>
            </div>
            <Link
              href="/swipe"
              className="bg-metro-yellow text-metro-black text-xs font-bold px-4 py-2 rounded-xl"
            >
              Find Mates
            </Link>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      {!currentSession && (
        <div className="px-5 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Link href="/travel">
              <div className="bg-metro-yellow rounded-3xl p-5 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-metro-black/60 text-xs font-semibold uppercase tracking-wider mb-1">Ready to commute?</p>
                  <h2 className="text-metro-black text-xl font-bold mb-3">I'm Traveling Now 🚇</h2>
                  <div className="flex items-center gap-2">
                    <div className="bg-metro-black/10 text-metro-black text-xs font-bold px-3 py-1.5 rounded-full">
                      Enter Route →
                    </div>
                  </div>
                </div>
                <div className="absolute right-4 bottom-2 text-6xl opacity-20">🚇</div>
              </div>
            </Link>
          </motion.div>
        </div>
      )}

      {/* Stats Row */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Live Travelers", value: activeTravelers, icon: Users, color: "text-metro-yellow" },
            { label: "Your Matches", value: matches.length, icon: MessageCircle, color: "text-emerald-400" },
            { label: "Active Routes", value: 12, icon: TrendingUp, color: "text-blue-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="bg-metro-card border border-metro-border rounded-2xl p-3 text-center"
            >
              <stat.icon size={18} className={`${stat.color} mx-auto mb-1`} />
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-metro-muted leading-tight">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      {matches.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Matches</h3>
            <Link href="/matches" className="text-xs text-metro-yellow">See all</Link>
          </div>
          <div className="space-y-2">
            {matches.slice(0, 3).map((match) => {
              const otherId = match.users.find((u) => u !== firebaseUid)!;
              const other = match.userDetails[otherId];
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Link href={`/chat/${match.id}`}>
                    <div className="bg-metro-card border border-metro-border rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-metro-border flex items-center justify-center text-lg font-bold text-white shrink-0">
                        {other?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{other?.name}</p>
                        <p className="text-xs text-metro-muted truncate">
                          {match.lastMessage || "Start a conversation!"}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-metro-yellow shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-5">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/swipe", emoji: "❤️", label: "Browse Travelers", desc: "Find your next connection" },
            { href: "/matches", emoji: "💬", label: "Your Chats", desc: `${matches.length} active conversations` },
            { href: "/travel", emoji: "🗺️", label: "Set Route", desc: "Enter today's commute" },
            { href: "/profile", emoji: "✏️", label: "Edit Profile", desc: "Update your info" },
          ].map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <Link href={action.href}>
                <div className="bg-metro-card border border-metro-border rounded-2xl p-4 hover:border-metro-yellow/40 transition-colors">
                  <span className="text-2xl block mb-2">{action.emoji}</span>
                  <p className="text-sm font-semibold text-white">{action.label}</p>
                  <p className="text-xs text-metro-muted mt-0.5">{action.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
