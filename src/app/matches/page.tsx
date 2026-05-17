"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store";
import { useMatches } from "@/hooks/useMatches";
import { BottomNav } from "@/components/layout/BottomNav";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function MatchesPage() {
  const { firebaseUid } = useAppStore();
  const matches = useMatches();

  return (
    <div className="min-h-dvh bg-metro-black pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <p className="text-metro-muted text-sm mb-1">Your network</p>
        <h1 className="text-2xl font-bold text-white">Matches 💬</h1>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <MessageCircle size={52} className="text-metro-border mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No matches yet</h3>
          <p className="text-metro-muted text-sm text-center mb-6">
            Start traveling and swipe right on fellow commuters to connect!
          </p>
          <Link href="/travel">
            <button className="btn-yellow w-auto px-8">Start Traveling</button>
          </Link>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {matches.map((match, i) => {
            const otherId = match.users.find((u) => u !== firebaseUid)!;
            const other = match.userDetails[otherId];
            const timeAgo = match.lastMessageAt
              ? formatDistanceToNow(match.lastMessageAt.toDate(), { addSuffix: true })
              : match.createdAt
              ? formatDistanceToNow(match.createdAt.toDate(), { addSuffix: true })
              : "";

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/chat/${match.id}`}>
                  <div className="bg-metro-card border border-metro-border rounded-2xl p-4 flex items-center gap-4 hover:border-metro-yellow/40 transition-colors active:scale-98">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-metro-yellow/20 to-metro-border flex items-center justify-center text-2xl font-bold text-white shrink-0 relative overflow-hidden">
                      {other?.name?.[0]?.toUpperCase()}
                      <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-metro-card" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white">{other?.name}</h3>
                        {timeAgo && (
                          <span className="text-xs text-metro-muted shrink-0">{timeAgo}</span>
                        )}
                      </div>
                      <p className="text-sm text-metro-muted truncate">
                        {match.lastMessage || "Say hi! 👋"}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
