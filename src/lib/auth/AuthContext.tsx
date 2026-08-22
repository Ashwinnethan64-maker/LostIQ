"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, subscribeToAuthState, syncUserProfile, signOutUser, signInWithGoogle } from "@/lib/firebase/auth";
import { logger } from "@/lib/logger";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInDemoUser: (role?: "user" | "admin") => void;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInGoogle: async () => {},
  signInDemoUser: () => {},
  logout: async () => {},
  isAdmin: false,
});

const DEMO_STORAGE_KEY = "campusfind_demo_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for demo/cached session
    const cachedDemo = typeof window !== "undefined" ? localStorage.getItem(DEMO_STORAGE_KEY) : null;
    if (cachedDemo) {
      try {
        const parsed = JSON.parse(cachedDemo);
        setUser(parsed);
        setLoading(false);
      } catch {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          setUser(profile);
          if (typeof window !== "undefined") {
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(profile));
          }
        } catch (err) {
          logger.error("Error synchronizing user profile", "AuthProvider", err);
        }
      } else {
        const demo = typeof window !== "undefined" ? localStorage.getItem(DEMO_STORAGE_KEY) : null;
        if (!demo) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInGoogle = async () => {
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      if (profile) {
        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(profile));
        }
      }
    } catch (err) {
      logger.error("Sign in failed", "AuthProvider", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInDemoUser = (role: "user" | "admin" = "user") => {
    const demoProfile: UserProfile = {
      id: role === "admin" ? "admin-demo-999" : "student-demo-101",
      email: role === "admin" ? "security.admin@campus.edu" : "alex.student@campus.edu",
      displayName: role === "admin" ? "Campus Security Officer" : "Alex Rivera (Student)",
      photoURL: null,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUser(demoProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    } catch (err) {
      logger.error("Logout error", "AuthProvider", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInGoogle,
        signInDemoUser,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
