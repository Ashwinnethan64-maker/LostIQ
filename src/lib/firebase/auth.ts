import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";
import { syncUserProfileInDb } from "../supabase/repository";
import { UserProfile } from "@/types";
import { logger } from "../logger";

export type { UserProfile };

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const profile: UserProfile = {
    id: user.uid, // Canonical Firebase Auth UID
    email: user.email || "",
    displayName: user.displayName || user.email?.split("@")[0] || "Campus User",
    photoURL: user.photoURL || null,
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    return await syncUserProfileInDb(profile);
  } catch (err) {
    logger.error("Failed to sync user profile in database", "AuthUtils", err);
    return profile;
  }
}

export async function signInWithGoogle(): Promise<UserProfile | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    logger.warn("Firebase Auth not initialized. Using demo user session.", "AuthUtils");
    const demoProfile: UserProfile = {
      id: "demo-user-123",
      email: "student@campus.edu",
      displayName: "Alex Rivera",
      photoURL: null,
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return await syncUserProfileInDb(demoProfile);
  }

  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return await syncUserProfile(cred.user);
  } catch (err) {
    logger.error("Google Sign-In failed", "AuthUtils", err);
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await firebaseSignOut(auth);
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
