import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";
import { UserProfile } from "@/types";
import { logger } from "../logger";

export type { UserProfile };

/**
 * Server-verified session bootstrap.
 * Exchanges a fresh Firebase ID Token with the server to guarantee
 * authorization and PostgreSQL user record creation before establishing a session.
 */
export async function bootstrapServerSession(user: User): Promise<UserProfile> {
  const token = await user.getIdToken(true); // Force fresh token

  const res = await fetch("/api/auth/bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success || !data.user) {
    throw new Error(data.error || "Server-side session verification failed");
  }

  logger.info("Server verification & user profile bootstrap succeeded", "AuthUtils", { uid: data.user.id });
  return data.user;
}

export async function signInWithGoogle(): Promise<UserProfile> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Please verify configuration.");
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    
    // Complete real server-side verification and bootstrap before returning
    return await bootstrapServerSession(cred.user);
  } catch (err: any) {
    logger.error("Google Sign-In sequence failed", "AuthUtils", err);

    // Provide friendly, actionable domain authorization guidance
    if (err.code === "auth/unauthorized-domain") {
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
      throw new Error(
        `Firebase Error: '${currentHost}' is not in Firebase Console Authorized Domains. Please add '${currentHost}' in Firebase Console > Authentication > Settings > Authorized Domains, or sign in via authorized port.`
      );
    }

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
