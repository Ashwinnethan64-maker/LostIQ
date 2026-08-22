import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import { getClaimsFromDb } from "@/lib/supabase/repository";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyServerSession(req);
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId");
    const requestedUserId = searchParams.get("userId") || session?.uid;

    if (!requestedUserId && !reportId) {
      return NextResponse.json({ success: true, count: 0, claims: [] });
    }

    // Query claims where the user is either the claimant (owner) or the finder
    let claims = [];
    if (requestedUserId) {
      const [ownerClaims, finderClaims] = await Promise.all([
        getClaimsFromDb({ claimantId: requestedUserId }),
        getClaimsFromDb({ finderId: requestedUserId }),
      ]);
      const combinedMap = new Map();
      for (const c of [...ownerClaims, ...finderClaims]) {
        if (!reportId || c.reportId === reportId) {
          combinedMap.set(c.id, c);
        }
      }
      claims = Array.from(combinedMap.values());
    } else if (reportId) {
      claims = await getClaimsFromDb({ reportId });
    }

    return NextResponse.json({ success: true, count: claims.length, claims });
  } catch (err: any) {
    logger.error("Error fetching claims", "ClaimsAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch claims" }, { status: 500 });
  }
}
