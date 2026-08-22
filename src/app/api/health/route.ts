import { NextResponse } from "next/server";
import { getFirebaseApp, getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase/client";
import { getSupabaseClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";

export async function GET() {
  const hasFirebaseConfig = Boolean(
    config.firebase.apiKey &&
    config.firebase.projectId &&
    config.firebase.authDomain
  );

  const supabase = getSupabaseClient();

  const status = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "LostIQ API",
    version: config.app.version,
    environment: process.env.NODE_ENV || "development",
    integrations: {
      firebase: {
        configured: hasFirebaseConfig,
        authInitialized: Boolean(getFirebaseAuth() || hasFirebaseConfig),
        storageInitialized: Boolean(getFirebaseStorage() || hasFirebaseConfig),
        mode: hasFirebaseConfig ? "live-cloud" : "local-mock",
      },
      supabase: {
        configured: Boolean(supabase),
        database: "PostgreSQL",
        canonicalIdentity: "Firebase Auth UID",
        status: supabase ? "connected" : "hybrid-local-store",
      },
      gemini: {
        configured: Boolean(config.gemini.apiKey),
        model: config.gemini.model,
        apiVersion: config.gemini.apiVersion,
      },
    },
    matchingEngine: {
      status: "ready",
      weights: config.matchingWeights,
    },
  };

  return NextResponse.json(status, { status: 200 });
}
