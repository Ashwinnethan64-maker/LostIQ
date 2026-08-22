"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, subscribeToAuthState, bootstrapServerSession, signOutUser, signInWithGoogle } from "@/lib/firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { logger } from "@/lib/logger";

export type AuthStateStatus = "INITIALIZING" | "AUTHENTICATING" | "BOOTSTRAPPING" | "AUTHORIZED" | "UNAUTHENTICATED" | "ERROR";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  status: AuthStateStatus;
  errorMessage: string | null;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  getFreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  status: "INITIALIZING",
  errorMessage: null,
  signInGoogle: async () => {},
  logout: async () => {},
  isAdmin: false,
  getFreshToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStateStatus>("INITIALIZING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Retrieve a fresh Firebase ID token for secure API requests
  const getFreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        return await auth.currentUser.getIdToken(false);
      }
    } catch (err) {
      logger.warn("Failed to retrieve fresh Firebase ID token", "AuthContext", err);
    }
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        setStatus("BOOTSTRAPPING");
        try {
          // Verify with server endpoint & sync PostgreSQL user record
          const verifiedProfile = await bootstrapServerSession(firebaseUser);
          if (isMounted) {
            setUser(verifiedProfile);
            setStatus("AUTHORIZED");
            setErrorMessage(null);
          }
        } catch (err: any) {
          logger.error("Server-side bootstrap validation failed for active Firebase user", "AuthContext", err);
          if (isMounted) {
            setUser(null);
            setStatus("ERROR");
            setErrorMessage(err.message || "Failed to verify authenticated session with server.");
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setStatus("UNAUTHENTICATED");
          setErrorMessage(null);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInGoogle = async () => {
    setStatus("AUTHENTICATING");
    setErrorMessage(null);
    try {
      const profile = await signInWithGoogle();
      setUser(profile);
      setStatus("AUTHORIZED");
    } catch (err: any) {
      logger.error("Google sign-in sequence failed", "AuthContext", err);
      setUser(null);
      setStatus("ERROR");
      setErrorMessage(err.message || "Google Authentication failed. Please try again.");
      throw err;
    }
  };

  // Issues 12, 13, 14, 15 Fix: Universal logout sequence with complete state wipe and "/" landing redirect
  const logout = async () => {
    setStatus("INITIALIZING");
    try {
      await signOutUser();
      setUser(null);
      setStatus("UNAUTHENTICATED");
      setErrorMessage(null);
      
      // Cleanly redirect to landing page root "/"
      router.push("/");
      router.refresh();
    } catch (err) {
      logger.error("Logout error", "AuthContext", err);
      setUser(null);
      setStatus("UNAUTHENTICATED");
      router.push("/");
    }
  };

  const loading = status === "INITIALIZING" || status === "AUTHENTICATING" || status === "BOOTSTRAPPING";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        status,
        errorMessage,
        signInGoogle,
        logout,
        isAdmin: user?.role === "admin",
        getFreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
