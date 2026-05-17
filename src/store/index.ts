import { create } from "zustand";
import { User, Match, Session } from "@/types";

interface AuthState {
  user: User | null;
  firebaseUid: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUid: (uid: string | null) => void;
  setLoading: (loading: boolean) => void;
}

interface SessionState {
  currentSession: Session | null;
  activeTravelers: number;
  setCurrentSession: (session: Session | null) => void;
  setActiveTravelers: (count: number) => void;
}

interface MatchState {
  matches: Match[];
  newMatch: Match | null;
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
  setNewMatch: (match: Match | null) => void;
  clearMatches: () => void;
}

interface SwipeState {
  /** All UIDs the current user has liked OR disliked this session */
  swipedUids: Set<string>;
  /** Mark a UID as swiped so it's filtered from future card loads */
  addSwipedUid: (uid: string) => void;
  /** Reset when user logs out or changes session */
  clearSwipedUids: () => void;
}

type AppStore = AuthState & SessionState & MatchState & SwipeState;

export const useAppStore = create<AppStore>((set) => ({
  // Auth
  user: null,
  firebaseUid: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setFirebaseUid: (uid) => set({ firebaseUid: uid }),
  setLoading: (isLoading) => set({ isLoading }),

  // Session
  currentSession: null,
  activeTravelers: 0,
  setCurrentSession: (session) => set({ currentSession: session }),
  setActiveTravelers: (count) => set({ activeTravelers: count }),

  // Matches
  matches: [],
  newMatch: null,
  setMatches: (matches) => set({ matches }),
  addMatch: (match) =>
    set((state) => {
      // Prevent duplicate match entries
      const alreadyExists = state.matches.some((m) => m.id === match.id);
      if (alreadyExists) return state;
      return { matches: [match, ...state.matches] };
    }),
  setNewMatch: (match) => set({ newMatch: match }),
  clearMatches: () => set({ matches: [], newMatch: null }),

  // Swipe
  swipedUids: new Set<string>(),
  addSwipedUid: (uid) =>
    set((state) => ({
      swipedUids: new Set([...state.swipedUids, uid]),
    })),
  clearSwipedUids: () => set({ swipedUids: new Set<string>() }),
}));