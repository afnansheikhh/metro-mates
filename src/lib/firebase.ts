import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "placeholder.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "placeholder",
  // FIX: must match .env.local exactly — new projects use .firebasestorage.app
  // not the legacy .appspot.com. getStorage() uses this to build the bucket URL;
  // a mismatch causes uploads to hang indefinitely with no error thrown.
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "placeholder.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000:web:000000",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// FIX: pass the bucket URL explicitly so the SDK never falls back to
// the legacy appspot.com format regardless of the firebaseConfig default.
export const storage = getStorage(
  app,
  `gs://${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`
);

export default app;