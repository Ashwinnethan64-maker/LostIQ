import { describe, it, expect } from "vitest";
import { requireAdminRole, AuthenticatedUserSession } from "@/lib/auth/server-auth";
import { validateImageUpload } from "@/lib/firebase/storage";

describe("Security and Auth Guards", () => {
  it("allows admin operations only for verified admin sessions", () => {
    const adminSession: AuthenticatedUserSession = {
      uid: "admin-1",
      email: "admin@campus.edu",
      role: "admin",
    };
    const userSession: AuthenticatedUserSession = {
      uid: "user-1",
      email: "user@campus.edu",
      role: "user",
    };

    expect(requireAdminRole(adminSession)).toBe(true);
    expect(requireAdminRole(userSession)).toBe(false);
    expect(requireAdminRole(null)).toBe(false);
  });

  it("enforces image upload MIME types and size limits", () => {
    const validImage = { type: "image/png", size: 2 * 1024 * 1024, name: "item.png" };
    const invalidMime = { type: "application/pdf", size: 1024, name: "doc.pdf" };
    const oversizedImage = { type: "image/jpeg", size: 8 * 1024 * 1024, name: "large.jpg" };

    expect(validateImageUpload(validImage).valid).toBe(true);
    expect(validateImageUpload(invalidMime).valid).toBe(false);
    expect(validateImageUpload(oversizedImage).valid).toBe(false);
  });
});
