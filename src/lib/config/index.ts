/**
 * Centralized environment and application configuration
 */
export const config = {
  app: {
    name: "LostIQ",
    tagline: "Intelligent Lost & Found",
    version: "1.0.0",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    apiVersion: process.env.GEMINI_API_VERSION || "v1",
  },
  matchingWeights: {
    visual: parseFloat(process.env.MATCH_WEIGHT_VISUAL || "0.40"),
    semantic: parseFloat(process.env.MATCH_WEIGHT_SEMANTIC || "0.25"),
    location: parseFloat(process.env.MATCH_WEIGHT_LOCATION || "0.20"),
    time: parseFloat(process.env.MATCH_WEIGHT_TIME || "0.10"),
    category: parseFloat(process.env.MATCH_WEIGHT_CATEGORY || "0.05"),
  },
};
