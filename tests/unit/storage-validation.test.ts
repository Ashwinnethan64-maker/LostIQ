import { describe, it, expect } from "vitest";
import { validateImageUpload, generateSafeFilename } from "@/lib/firebase/storage";

describe("Storage & Image Validation Suite", () => {
  it("approves valid JPEG, PNG, and WebP files under 5MB", () => {
    const validJpg = { type: "image/jpeg", size: 2 * 1024 * 1024, name: "item.jpg" };
    const validPng = { type: "image/png", size: 1024 * 1024, name: "item.png" };
    const validWebp = { type: "image/webp", size: 500 * 1024, name: "item.webp" };

    expect(validateImageUpload(validJpg).valid).toBe(true);
    expect(validateImageUpload(validPng).valid).toBe(true);
    expect(validateImageUpload(validWebp).valid).toBe(true);
  });

  it("rejects files exceeding 5MB limit", () => {
    const oversized = { type: "image/jpeg", size: 6 * 1024 * 1024, name: "huge.jpg" };
    const res = validateImageUpload(oversized);

    expect(res.valid).toBe(false);
    expect(res.error).toContain("5MB");
  });

  it("rejects unsupported MIME types (e.g. PDF, EXE, GIF)", () => {
    const pdf = { type: "application/pdf", size: 1024 * 1024, name: "doc.pdf" };
    const exe = { type: "application/x-msdownload", size: 1024 * 1024, name: "malware.exe" };
    const gif = { type: "image/gif", size: 1024 * 1024, name: "anim.gif" };

    expect(validateImageUpload(pdf).valid).toBe(false);
    expect(validateImageUpload(exe).valid).toBe(false);
    expect(validateImageUpload(gif).valid).toBe(false);
  });

  it("generates sanitized filenames without collisions", () => {
    const name1 = generateSafeFilename("photo..test.png");
    const name2 = generateSafeFilename("photo..test.png");

    expect(name1).toMatch(/\.png$/);
    expect(name1).not.toEqual(name2);
  });
});
