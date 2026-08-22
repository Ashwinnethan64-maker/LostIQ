import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { config } from "../config";
import { logger } from "../logger";

// Direct client-safe config resolution from process.env with fallback to config object
export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || config.firebase.apiKey || "AIzaSyAaE8frrEIDFAige9BM3D7OG3nYDwY5eyg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || config.firebase.authDomain || "lostiq-16c8b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || config.firebase.projectId || "lostiq-16c8b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || config.firebase.storageBucket || "lostiq-16c8b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || config.firebase.messagingSenderId || "214242476147",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || config.firebase.appId || "1:214242476147:web:5163ec48c4e96637deaa06",
};

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;

  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(firebaseClientConfig);
      logger.info("Firebase initialized successfully (Auth & Storage)", "FirebaseClient", {
        projectId: firebaseClientConfig.projectId,
      });
    }
    return firebaseApp;
  } catch (err) {
    logger.error("Failed to initialize Firebase app", "FirebaseClient", err);
    // If already exists, return getApp()
    firebaseApp = getApp();
    return firebaseApp;
  }
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const app = getFirebaseApp();
  auth = getAuth(app);
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (storage) return storage;
  const app = getFirebaseApp();
  storage = getStorage(app);
  return storage;
}
