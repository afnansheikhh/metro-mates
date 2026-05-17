import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserDocument, getUserDocument } from "./firestore";

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

/**
 * Sign in with Google popup.
 * Creates a Firestore user document on first login.
 * Returns { firebaseUser, isNewUser }.
 */
export async function signInWithGoogle(): Promise<{
  firebaseUser: FirebaseUser;
  isNewUser: boolean;
}> {
  await setPersistence(auth, browserLocalPersistence);

  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;

  const existing = await getUserDocument(firebaseUser.uid);

  if (!existing) {
    await createUserDocument(firebaseUser.uid, {
      name: firebaseUser.displayName || undefined,
      email: firebaseUser.email || undefined,
      photoURL: firebaseUser.photoURL || undefined,
    });
    return { firebaseUser, isNewUser: true };
  }

  return { firebaseUser, isNewUser: false };
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
