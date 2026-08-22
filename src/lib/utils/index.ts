import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserProfile } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(dateString);
  }
}

/**
 * Safely extracts user's first name from authenticated Firebase UserProfile.
 * Formats "Ashwin Nethan" -> "Ashwin", "ash970053@gmail.com" -> "Ash970053", "ashwin_nethan56" -> "Ashwin".
 */
export function getFirstName(user: UserProfile | null | undefined): string {
  if (!user) return "Campus User";

  // 1. Try displayName first
  if (user.displayName && user.displayName.trim()) {
    const cleanDisplay = user.displayName.trim().split(/[ _.]/)[0];
    if (cleanDisplay) {
      return cleanDisplay.charAt(0).toUpperCase() + cleanDisplay.slice(1);
    }
  }

  // 2. Fallback to email local-part cleanly
  if (user.email && user.email.includes("@")) {
    const localPart = user.email.split("@")[0].split(/[ _.]/)[0];
    if (localPart) {
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
  }

  return "Campus User";
}
