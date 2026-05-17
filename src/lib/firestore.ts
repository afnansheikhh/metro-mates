import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { User, Session, Like, Match, Message, Report } from "@/types";

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function createUserDocument(
  uid: string,
  data: Partial<User>
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    uid,
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    isActive: true,
    blockedUsers: [],
    ...data,
  });
}

export async function getUserDocument(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as User) : null;
}

export async function updateUserDocument(
  uid: string,
  data: Partial<User>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToUser(
  uid: string,
  callback: (user: User | null) => void
): () => void {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    callback(snap.exists() ? (snap.data() as User) : null);
  });
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  from: string,
  to: string,
  userName: string,
  userPhoto?: string
): Promise<string> {
  await deactivateUserSessions(userId);

  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + 45 * 60 * 1000)
  );

  const ref = await addDoc(collection(db, "sessions"), {
    userId,
    from,
    to,
    active: true,
    timestamp: serverTimestamp(),
    expiresAt,
    userName,
    userPhoto: userPhoto || null,
  });

  return ref.id;
}

export async function deactivateUserSessions(userId: string): Promise<void> {
  const q = query(
    collection(db, "sessions"),
    where("userId", "==", userId),
    where("active", "==", true)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.forEach((d) => batch.update(d.ref, { active: false }));
  await batch.commit();
}

export async function getActiveSessions(
  excludeUserId: string,
  blockedUsers: string[] = []
): Promise<Session[]> {
  const now = Timestamp.now();
  const q = query(
    collection(db, "sessions"),
    where("active", "==", true),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Session))
    .filter(
      (s) =>
        s.userId !== excludeUserId &&
        !blockedUsers.includes(s.userId) &&
        s.expiresAt.toMillis() > now.toMillis()
    );
}

// ─── LIKES & DISLIKES ─────────────────────────────────────────────────────────

/**
 * Persist a right-swipe (like). Returns true if this creates a mutual match.
 */
export async function createLike(
  fromUserId: string,
  toUserId: string
): Promise<boolean> {
  // Check if the other user has already liked us
  const q = query(
    collection(db, "likes"),
    where("fromUserId", "==", toUserId),
    where("toUserId", "==", fromUserId)
  );
  const snap = await getDocs(q);
  const isMatch = !snap.empty;

  await addDoc(collection(db, "likes"), {
    fromUserId,
    toUserId,
    action: "like",
    timestamp: serverTimestamp(),
  });

  return isMatch;
}

/**
 * Persist a left-swipe (dislike/pass) so the user never sees this person again.
 */
export async function createDislike(
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await addDoc(collection(db, "likes"), {
    fromUserId,
    toUserId,
    action: "dislike",
    timestamp: serverTimestamp(),
  });
}

/**
 * Returns all UIDs the user has already liked OR disliked.
 * Uses a single "likes" collection that stores both actions.
 */
export async function getSwipedUserIds(userId: string): Promise<string[]> {
  const q = query(
    collection(db, "likes"),
    where("fromUserId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().toUserId as string);
}

/** @deprecated Use getSwipedUserIds instead */
export async function getLikedUserIds(userId: string): Promise<string[]> {
  return getSwipedUserIds(userId);
}

// ─── MATCHES ──────────────────────────────────────────────────────────────────

export async function createMatch(
  user1Id: string,
  user1Details: { name: string; photoURL?: string; email?: string },
  user2Id: string,
  user2Details: { name: string; photoURL?: string; email?: string }
): Promise<string> {
  const ref = await addDoc(collection(db, "matches"), {
    users: [user1Id, user2Id],
    userDetails: {
      [user1Id]: user1Details,
      [user2Id]: user2Details,
    },
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToMatches(
  userId: string,
  callback: (matches: Match[]) => void
): () => void {
  const q = query(
    collection(db, "matches"),
    where("users", "array-contains", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match)));
  });
}

export async function getMatch(matchId: string): Promise<Match | null> {
  if (!matchId) return null;
  const snap = await getDoc(doc(db, "matches", matchId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Match) : null;
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

export async function sendMessage(
  matchId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<string> {
  if (!matchId?.trim()) throw new Error("sendMessage: matchId is required");
  if (!senderId?.trim()) throw new Error("sendMessage: senderId is required");
  if (!text?.trim()) throw new Error("sendMessage: text cannot be empty");

  const trimmedText = text.trim();
  const safeSenderName = senderName?.trim() || "Unknown";

  const ref = await addDoc(collection(db, "messages"), {
    matchId,
    senderId,
    senderName: safeSenderName,
    text: trimmedText,
    timestamp: serverTimestamp(),
    read: false,
  });

  try {
    await updateDoc(doc(db, "matches", matchId), {
      lastMessage: trimmedText,
      lastMessageAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("[sendMessage] Could not update match lastMessage:", err);
  }

  return ref.id;
}

export function subscribeToMessages(
  matchId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!matchId) {
    console.warn("[subscribeToMessages] matchId is required — skipping");
    return () => {};
  }

  const q = query(
    collection(db, "messages"),
    where("matchId", "==", matchId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Message)
      );
      callback(msgs);
    },
    (error) => {
      console.error("[subscribeToMessages] Firestore error:", error);
      onError?.(error as Error);
    }
  );
}

// ─── REPORTS & BLOCKS ────────────────────────────────────────────────────────

export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reason: string,
  description?: string
): Promise<void> {
  await addDoc(collection(db, "reports"), {
    reporterId,
    reportedUserId,
    reason,
    description: description || "",
    timestamp: serverTimestamp(),
  });
}

export async function blockUser(
  userId: string,
  blockedUserId: string
): Promise<void> {
  const userRef = doc(db, "users", userId);
  const userData = await getDoc(userRef);
  if (userData.exists()) {
    const blocked: string[] = userData.data().blockedUsers || [];
    if (!blocked.includes(blockedUserId)) {
      await updateDoc(userRef, {
        blockedUsers: [...blocked, blockedUserId],
      });
    }
  }
}

// ─── ACTIVE TRAVELER COUNT ────────────────────────────────────────────────────

export function subscribeToActiveTravelerCount(
  callback: (count: number) => void
): () => void {
  const q = query(
    collection(db, "sessions"),
    where("active", "==", true)
  );
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const active = snap.docs.filter((d) => {
      const exp = d.data().expiresAt as Timestamp;
      return exp.toMillis() > now;
    });
    callback(active.length);
  });
}