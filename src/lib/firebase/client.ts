import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { config } from "../config";
import { logger } from "../logger";

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

const hasFirebaseConfig = Boolean(
  config.firebase.apiKey &&
  config.firebase.projectId &&
  config.firebase.authDomain
);

export function getFirebaseApp(): FirebaseApp | null {
  if (firebaseApp) return firebaseApp;

  if (!hasFirebaseConfig) {
    logger.warn(
      "Firebase environment variables not detected. Running in local fallback mode.",
      "FirebaseClient"
    );
    return null;
  }

  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(config.firebase);
      logger.info("Firebase initialized successfully (Auth & Storage)", "FirebaseClient");
    }
    return firebaseApp;
  } catch (err) {
    logger.error("Failed to initialize Firebase app", "FirebaseClient", err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  const app = getFirebaseApp();
  if (!app) return null;
  auth = getAuth(app);
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (storage) return storage;
  const app = getFirebaseApp();
  if (!app) return null;
  storage = getStorage(app);
  return storage;
}
