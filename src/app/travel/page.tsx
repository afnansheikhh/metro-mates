"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createSession, deactivateUserSessions } from "@/lib/firestore";
import { useAppStore } from "@/store";
import { METRO_STATIONS } from "@/types";
import { BottomNav } from "@/components/layout/BottomNav";
import toast from "react-hot-toast";
import { ArrowRight, MapPin, X, Train } from "lucide-react";

const ALL_STATIONS = Object.values(METRO_STATIONS).flat().sort();

export default function TravelPage() {
  const router = useRouter();
  const { user, firebaseUid, currentSession, setCurrentSession } = useAppStore();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [loading, setLoading] = useState(false);

  const fromSuggestions = ALL_STATIONS.filter(
    (s) => s.toLowerCase().includes(fromQuery.toLowerCase()) && fromQuery.length > 0
  ).slice(0, 8);

  const toSuggestions = ALL_STATIONS.filter(
    (s) => s.toLowerCase().includes(toQuery.toLowerCase()) && toQuery.length > 0 && s !== from
  ).slice(0, 8);

  const handleStartTravel = async () => {
    if (!from || !to) {
      toast.error("Select both stations");
      return;
    }
    if (from === to) {
      toast.error("From and To cannot be the same");
      return;
    }
    if (!firebaseUid || !user) return;

    setLoading(true);
    try {
      const sessionId = await createSession(
        firebaseUid,
        from,
        to,
        user.name || "Traveler",
        user.photoURL
      );
      setCurrentSession({ userId: firebaseUid, from, to, active: true } as any);
      toast.success("Route set! Find your mates 🚇");
      router.push("/swipe");
    } catch {
      toast.error("Failed to set route");
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!firebaseUid) return;
    await deactivateUserSessions(firebaseUid);
    setCurrentSession(null);
    setFrom("");
    setTo("");
    setFromQuery("");
    setToQuery("");
    toast.success("Session ended");
  };

  return (
    <div className="min-h-dvh bg-metro-black pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-metro-muted text-sm mb-1">Your Commute</p>
          <h1 className="text-2xl font-bold text-white">Set Route 🗺️</h1>
        </motion.div>
      </div>

      {/* Active Session */}
      {currentSession && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-5 mb-6"
        >
          <div className="bg-metro-yellow/10 border border-metro-yellow/30 rounded-2xl p-4">
            <p className="text-metro-yellow text-xs font-semibold uppercase tracking-wider mb-3">Active Session</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-metro-card border border-metro-border rounded-xl p-3">
                <p className="text-xs text-metro-muted mb-1">From</p>
                <p className="font-semibold text-white">{currentSession.from}</p>
              </div>
              <ArrowRight size={16} className="text-metro-yellow shrink-0" />
              <div className="flex-1 bg-metro-card border border-metro-border rounded-xl p-3">
                <p className="text-xs text-metro-muted mb-1">To</p>
                <p className="font-semibold text-white">{currentSession.to}</p>
              </div>
            </div>
            <button
              onClick={handleEndSession}
              className="w-full border border-red-500/50 text-red-400 py-3 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors"
            >
              End Session
            </button>
          </div>
        </motion.div>
      )}

      {/* Route Form */}
      <div className="px-5 space-y-4">
        {/* From Station */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-xs text-metro-muted uppercase tracking-wider mb-2 block">From Station</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <div className="w-2.5 h-2.5 rounded-full bg-metro-yellow" />
            </div>
            <input
              type="text"
              value={from || fromQuery}
              onChange={(e) => {
                setFromQuery(e.target.value);
                setFrom("");
                setActiveField("from");
              }}
              onFocus={() => setActiveField("from")}
              placeholder="Search departure station..."
              className="input-base pl-10 pr-10"
            />
            {from && (
              <button
                onClick={() => { setFrom(""); setFromQuery(""); }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X size={16} className="text-metro-muted" />
              </button>
            )}
          </div>
          {activeField === "from" && fromSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 bg-metro-card border border-metro-border rounded-2xl overflow-hidden"
            >
              {fromSuggestions.map((station) => (
                <button
                  key={station}
                  onClick={() => {
                    setFrom(station);
                    setFromQuery(station);
                    setActiveField(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-metro-border transition-colors text-left border-b border-metro-border/50 last:border-0"
                >
                  <MapPin size={14} className="text-metro-yellow shrink-0" />
                  <span className="text-sm text-white">{station}</span>
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Route line visual */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-px h-6 bg-metro-border mx-[5px]" />
          <Train size={14} className="text-metro-muted" />
          <span className="text-xs text-metro-muted">metro route</span>
        </div>

        {/* To Station */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="text-xs text-metro-muted uppercase tracking-wider mb-2 block">To Station</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-metro-yellow" />
            </div>
            <input
              type="text"
              value={to || toQuery}
              onChange={(e) => {
                setToQuery(e.target.value);
                setTo("");
                setActiveField("to");
              }}
              onFocus={() => setActiveField("to")}
              placeholder="Search destination station..."
              className="input-base pl-10 pr-10"
            />
            {to && (
              <button
                onClick={() => { setTo(""); setToQuery(""); }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X size={16} className="text-metro-muted" />
              </button>
            )}
          </div>
          {activeField === "to" && toSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 bg-metro-card border border-metro-border rounded-2xl overflow-hidden"
            >
              {toSuggestions.map((station) => (
                <button
                  key={station}
                  onClick={() => {
                    setTo(station);
                    setToQuery(station);
                    setActiveField(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-metro-border transition-colors text-left border-b border-metro-border/50 last:border-0"
                >
                  <MapPin size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-sm text-white">{station}</span>
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-metro-card border border-metro-border rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">⏱️</span>
            <div>
              <p className="text-sm font-medium text-white">45-minute window</p>
              <p className="text-xs text-metro-muted mt-0.5">
                Your session auto-expires after 45 mins. You can end it early anytime.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleStartTravel}
          disabled={!from || !to || loading}
          className="btn-yellow flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-metro-black/30 border-t-metro-black rounded-full animate-spin" />
          ) : (
            <>Find Metro Mates <ArrowRight size={18} /></>
          )}
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
}
