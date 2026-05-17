"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useAnimation,
  PanInfo,
} from "framer-motion";
import { useAppStore } from "@/store";
import {
  getActiveSessions,
  createLike,
  createDislike,
  createMatch,
  getUserDocument,
  getSwipedUserIds,
} from "@/lib/firestore";
import { BottomNav } from "@/components/layout/BottomNav";
import { SwipeCard } from "@/types";
import { Match } from "@/types";
import { Heart, X, Zap, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";

// ─── Draggable top card ───────────────────────────────────────────────────────

interface DraggableCardProps {
  card: SwipeCard;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  controls: ReturnType<typeof useAnimation>;
}

function DraggableCard({
  card,
  onSwipeLeft,
  onSwipeRight,
  controls,
}: DraggableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-28, 0, 28]);
  const likeOpacity = useTransform(x, [25, 90], [0, 1]);
  const nopeOpacity = useTransform(x, [-90, -25], [1, 0]);

  const handleDragEnd = useCallback(
    async (_: PointerEvent, info: PanInfo) => {
      const swipeRight = info.offset.x > 100 || info.velocity.x > 500;
      const swipeLeft = info.offset.x < -100 || info.velocity.x < -500;

      if (swipeRight) {
        await controls.start({
          x: 650,
          y: info.offset.y * 1.2,
          rotate: 30,
          opacity: 0,
          transition: { duration: 0.32, ease: "easeOut" },
        });
        onSwipeRight();
      } else if (swipeLeft) {
        await controls.start({
          x: -650,
          y: info.offset.y * 1.2,
          rotate: -30,
          opacity: 0,
          transition: { duration: 0.32, ease: "easeOut" },
        });
        onSwipeLeft();
      } else {
        // Snap back
        controls.start({
          x: 0,
          y: 0,
          rotate: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 420, damping: 32 },
        });
      }
    },
    [controls, onSwipeLeft, onSwipeRight]
  );

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, rotate, zIndex: 20 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
    >
      {/* LIKE stamp */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-5 z-30 -rotate-12 border-[3px] border-green-400 rounded-xl px-3 py-1.5 pointer-events-none"
      >
        <span className="text-green-400 font-black text-xl tracking-widest drop-shadow">
          LIKE
        </span>
      </motion.div>

      {/* NOPE stamp */}
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute top-8 right-5 z-30 rotate-12 border-[3px] border-red-400 rounded-xl px-3 py-1.5 pointer-events-none"
      >
        <span className="text-red-400 font-black text-xl tracking-widest drop-shadow">
          NOPE
        </span>
      </motion.div>

      <CardFace card={card} />
    </motion.div>
  );
}

// ─── Card face (shared visual) ────────────────────────────────────────────────

function CardFace({ card }: { card: SwipeCard }) {
  return (
    <div className="h-[500px] rounded-3xl overflow-hidden bg-metro-card border border-metro-border relative select-none">
      <div className="h-[320px] relative bg-gradient-to-br from-metro-border to-metro-dark">
        {card.photoURL ? (
          <Image
            src={card.photoURL}
            alt={card.name}
            fill
            className="object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl font-bold text-metro-border">
              {card.name[0]}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-metro-card via-transparent to-transparent" />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-white">
              {card.name}, {card.age}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Zap size={12} className="text-metro-yellow" />
              <span className="text-xs text-metro-muted">
                {card.from} → {card.to}
              </span>
            </div>
          </div>
          {card.gender && (
            <span className="text-xs bg-metro-border text-metro-muted px-2 py-1 rounded-lg capitalize">
              {card.gender}
            </span>
          )}
        </div>

        {card.bio && (
          <p className="text-sm text-metro-muted line-clamp-2 mb-3">
            {card.bio}
          </p>
        )}

        {card.interests && card.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="text-xs bg-metro-yellow/10 text-metro-yellow px-2 py-1 rounded-lg border border-metro-yellow/20"
              >
                {interest}
              </span>
            ))}
            {card.interests.length > 4 && (
              <span className="text-xs text-metro-muted px-2 py-1">
                +{card.interests.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Match popup ──────────────────────────────────────────────────────────────

function MatchPopup({
  card,
  onClose,
  onChat,
}: {
  card: SwipeCard;
  onClose: () => void;
  onChat: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-metro-black/90 px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-metro-card border border-metro-yellow/30 rounded-3xl p-8 text-center w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-3">🚇</div>
        <h2 className="text-2xl font-bold text-white mb-1">It's a Match!</h2>
        <p className="text-metro-muted text-sm mb-1">
          You and{" "}
          <span className="text-white font-medium">{card.name}</span> liked each
          other
        </p>
        <p className="text-xs text-metro-muted mb-6">
          Both traveling {card.from} → {card.to}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-metro-border text-metro-muted text-sm font-medium"
          >
            Keep Swiping
          </button>
          <button
            onClick={onChat}
            className="flex-1 py-3 rounded-2xl bg-metro-yellow text-metro-black text-sm font-bold"
          >
            Start Chat 💬
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SwipePage() {
  const { user, firebaseUid, currentSession, swipedUids, addSwipedUid, addMatch } =
    useAppStore();
  const router = useRouter();

  const [cards, setCards] = useState<SwipeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<SwipeCard | null>(null);

  /**
   * FIX: Use a ref to track whether a swipe is in-flight.
   * Using useState for this caused stale closures — the `swiping` boolean
   * captured in callbacks never reflected the latest value, so the guard
   * either never triggered or permanently blocked the next swipe.
   */
  const swipingRef = useRef(false);

  // Shared animation controls for the top card
  const topControls = useAnimation();

  useEffect(() => {
    if (currentSession) loadTravelers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession]);

  /**
   * FIX: Load already-swiped UIDs from Firestore AND merge with in-memory
   * Zustand set so we filter correctly even across page refreshes.
   */
  const loadTravelers = async () => {
    if (!firebaseUid || !currentSession) return;
    setLoading(true);
    try {
      // Fetch all UIDs already swiped (persisted in Firestore)
      const persistedSwipedIds = await getSwipedUserIds(firebaseUid);

      // Build a unified exclusion set: persisted + in-memory (optimistic)
      const allSwipedUids = new Set([
        ...persistedSwipedIds,
        ...Array.from(swipedUids),
      ]);

      const sessions = await getActiveSessions(
        firebaseUid,
        user?.blockedUsers || []
      );
      const relevant = sessions.filter(
        (s) =>
          s.from === currentSession.from || s.to === currentSession.to
      );

      const seenUids = new Set<string>(); // FIX: prevent duplicate cards
      const result: SwipeCard[] = [];

      for (const session of relevant.slice(0, 20)) {
        // FIX: Skip already-swiped users and duplicates
        if (allSwipedUids.has(session.userId)) continue;
        if (seenUids.has(session.userId)) continue;
        seenUids.add(session.userId);

        const userDoc = await getUserDocument(session.userId);
        if (!userDoc?.onboardingCompleted) continue;
        if (user?.sameGenderMode && userDoc.gender !== user.gender) continue;

        result.push({
          uid: session.userId,
          name: userDoc.name || "Traveler",
          age: userDoc.age || 25,
          bio: userDoc.bio,
          interests: userDoc.interests,
          photoURL: userDoc.photoURL,
          from: session.from,
          to: session.to,
          gender: userDoc.gender,
        });
      }

      setCards(result);
    } catch {
      toast.error("Failed to load travelers");
    } finally {
      setLoading(false);
    }
  };

  /**
   * FIX: Core swipe handler that:
   * 1. Optimistically removes the card from local state IMMEDIATELY
   * 2. Adds the UID to Zustand's swipedUids so it's filtered on next load
   * 3. Resets animation controls for the newly-revealed card
   * 4. Persists the swipe action to Firestore in the background
   * 5. Handles match creation and optimistically prepends to matches list
   */
  const handleSwipeDone = useCallback(
    async (direction: "left" | "right", card: SwipeCard) => {
      // ── 1. Optimistic UI: remove card and mark as swiped IMMEDIATELY ──
      setCards((prev) => {
        // Remove the specific card by uid — not just slice(-1) which is
        // order-dependent and can remove the wrong card under fast swipes.
        return prev.filter((c) => c.uid !== card.uid);
      });

      // ── 2. Track in Zustand so loadTravelers filters it next time ──
      addSwipedUid(card.uid);

      // ── 3. Reset animation controls for the next card ──
      topControls.set({ x: 0, rotate: 0, opacity: 1 });

      // ── 4 & 5. Persist to Firestore in the background ──
      if (firebaseUid && user) {
        try {
          if (direction === "right") {
            const isMatch = await createLike(firebaseUid, card.uid);
            if (isMatch) {
              const other = await getUserDocument(card.uid);
              if (other) {
                const matchId = await createMatch(
                  firebaseUid,
                  {
                    name: user.name || "You",
                    photoURL: user.photoURL,
                    email: user.email,
                  },
                  card.uid,
                  {
                    name: card.name,
                    photoURL: card.photoURL,
                    email: other.email,
                  }
                );

                // ── Optimistically add match to Zustand store ──
                // The Firestore real-time listener in AuthProvider will also
                // pick this up, but addMatch deduplicates so that's safe.
                const optimisticMatch: Match = {
                  id: matchId,
                  users: [firebaseUid, card.uid],
                  userDetails: {
                    [firebaseUid]: {
                      name: user.name || "You",
                      photoURL: user.photoURL,
                      email: user.email,
                    },
                    [card.uid]: {
                      name: card.name,
                      photoURL: card.photoURL,
                      email: other.email,
                    },
                  },
                  createdAt: Timestamp.now(),
                };
                addMatch(optimisticMatch);
                setMatchData(card);
              }
            }
          } else {
            // Persist left-swipe so this user is excluded on next session load
            await createDislike(firebaseUid, card.uid);
          }
        } catch (err) {
          console.error("Swipe persistence error:", err);
          // Don't revert optimistic UI — a failed Firestore write is recoverable
          // and reverting causes jarring UX. The card is already visually gone.
        }
      }

      // ── Allow next swipe ──
      swipingRef.current = false;
    },
    [firebaseUid, user, topControls, addSwipedUid, addMatch]
  );

  /**
   * FIX: Button-triggered swipe.
   * Reads the current top card from a functional state update to avoid
   * stale closure issues — the most common cause of "swipe UI freeze".
   */
  const buttonSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (swipingRef.current) return;

      // Capture the current top card synchronously inside setState
      // to guarantee we read the latest state, not a stale closure copy.
      let topCard: SwipeCard | null = null;
      setCards((prev) => {
        topCard = prev.length > 0 ? prev[prev.length - 1] : null;
        return prev; // no change — we're just reading
      });

      if (!topCard) return;
      swipingRef.current = true;

      await topControls.start({
        x: direction === "right" ? 650 : -650,
        rotate: direction === "right" ? 30 : -30,
        opacity: 0,
        transition: { duration: 0.32, ease: "easeOut" },
      });

      await handleSwipeDone(direction, topCard);
    },
    [handleSwipeDone, topControls]
  );

  /**
   * FIX: Drag callback — the card has already animated itself out.
   * We capture the swiped card before any state update using a ref-like
   * snapshot to avoid stale closure reading the wrong card.
   */
  const handleDragSwipe = useCallback(
    (direction: "left" | "right") => {
      if (swipingRef.current) return;

      let topCard: SwipeCard | null = null;
      setCards((prev) => {
        topCard = prev.length > 0 ? prev[prev.length - 1] : null;
        return prev;
      });

      if (!topCard) return;
      swipingRef.current = true;

      // handleSwipeDone is async but we don't need to await here —
      // the optimistic removal already happened synchronously inside it.
      handleSwipeDone(direction, topCard);
    },
    [handleSwipeDone]
  );

  // ── no session ──
  if (!currentSession) {
    return (
      <div className="min-h-dvh bg-metro-black flex flex-col items-center justify-center px-6 pb-24">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-white mb-2">No active route</h2>
          <p className="text-metro-muted text-sm mb-6">
            Set your travel route first to find metro mates
          </p>
          <Link href="/travel">
            <button className="btn-yellow w-auto px-8">Set Route</button>
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const topCard = cards.length > 0 ? cards[cards.length - 1] : null;
  // Show at most 4 cards in the DOM stack — avoids layout thrash on large decks
  const visibleStack = cards.slice(-4);

  return (
    <div className="min-h-dvh bg-metro-black pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-metro-muted text-sm">Travelers on</p>
        <h1 className="text-xl font-bold text-white">
          {currentSession.from} → {currentSession.to}
        </h1>
      </div>

      {/* Card area */}
      <div className="px-5">
        {loading ? (
          <div className="h-[520px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-2 border-metro-yellow border-t-transparent rounded-full animate-spin" />
              <p className="text-metro-muted text-sm">Finding travelers...</p>
            </div>
          </div>
        ) : cards.length === 0 ? (
          <div className="h-[520px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                You've seen everyone!
              </h3>
              <button
                onClick={loadTravelers}
                className="mt-2 text-metro-yellow text-sm font-medium border border-metro-yellow/30 px-4 py-2 rounded-xl flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={14} />
                Refresh deck
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Card Stack */}
            <div className="relative h-[500px]">
              {/*
               * FIX: AnimatePresence wraps the stack so React properly
               * unmounts exited cards instead of leaving ghost elements.
               * The `key` on each card is the uid — not the array index —
               * so React tracks identity correctly across re-renders.
               */}
              <AnimatePresence>
                {visibleStack.map((card, i) => {
                  const stackIndex = visibleStack.length - 1 - i; // 0 = top
                  const isTop = stackIndex === 0;

                  if (isTop) {
                    return (
                      <DraggableCard
                        key={card.uid}
                        card={card}
                        controls={topControls}
                        onSwipeLeft={() => handleDragSwipe("left")}
                        onSwipeRight={() => handleDragSwipe("right")}
                      />
                    );
                  }

                  return (
                    <motion.div
                      key={card.uid}
                      className="absolute inset-0 pointer-events-none"
                      initial={{ scale: 1 - stackIndex * 0.04, y: stackIndex * 10 }}
                      animate={{
                        scale: 1 - stackIndex * 0.04,
                        y: stackIndex * 10,
                      }}
                      exit={{ scale: 0.9, opacity: 0, y: 30 }}
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                      style={{ zIndex: 20 - stackIndex }}
                    >
                      <CardFace card={card} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-6 mt-4">
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.06 }}
                onClick={() => buttonSwipe("left")}
                disabled={!topCard}
                className="w-16 h-16 rounded-full bg-metro-card border border-metro-border flex items-center justify-center shadow-lg disabled:opacity-40 transition-opacity"
              >
                <X size={28} className="text-red-400" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.06 }}
                onClick={() => buttonSwipe("right")}
                disabled={!topCard}
                className="w-16 h-16 rounded-full bg-metro-yellow flex items-center justify-center shadow-lg shadow-yellow-500/30 disabled:opacity-40 transition-opacity"
              >
                <Heart
                  size={28}
                  className="text-metro-black"
                  fill="currentColor"
                />
              </motion.button>
            </div>
          </>
        )}
      </div>

      {/* Match popup */}
      <AnimatePresence>
        {matchData && (
          <MatchPopup
            card={matchData}
            onClose={() => setMatchData(null)}
            onChat={() => {
              setMatchData(null);
              router.push("/matches");
            }}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}