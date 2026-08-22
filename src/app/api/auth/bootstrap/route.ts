import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import { syncUserProfileInDb } from "@/lib/supabase/repository";
import { UserProfile } from "@/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Endpoint for client-to-server auth bootstrap:
 * 1. Verifies the fresh Firebase ID token.
 * 2. Creates or syncs the application user profile in Supabase PostgreSQL.
 * 3. Returns the verified, authorized application session.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await verifyServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid or expired Firebase ID token" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const userProfile: UserProfile = {
      id: session.uid,
      email: session.email || body.email || "",
      displayName: session.displayName || body.displayName || session.email?.split("@")[0] || "Campus User",
      photoURL: session.photoURL || body.photoURL || null,
      role: session.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const synced = await syncUserProfileInDb(userProfile);
    logger.info("Application user successfully bootstrapped & verified", "AuthBootstrapAPI", { uid: synced.id });

    return NextResponse.json({
      success: true,
      user: synced,
      message: "Session verified and profile bootstrapped",
    }, { status: 200 });
  } catch (err: any) {
    logger.error("Error during auth bootstrap", "AuthBootstrapAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to bootstrap session" }, { status: 500 });
  }
}
