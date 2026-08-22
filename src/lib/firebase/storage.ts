import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./client";
import { logger } from "../logger";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageUpload(file: { type: string; size: number; name: string }): UploadValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format (${file.type}). Supported formats: JPEG, PNG, WebP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  return { valid: true };
}

/**
 * Fast Client-Side Image Compression/Resizing with safe fallback
 */
export async function optimizeImageClientSide(file: File, maxDimension = 1280, quality = 0.82): Promise<Blob> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  if (file.size < 350 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      const reader = new FileReader();

      // Timeout safety: if canvas hangs, resolve with original file immediately
      const timeout = setTimeout(() => {
        resolve(file);
      }, 1500);

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                clearTimeout(timeout);
                if (blob && blob.size < file.size) {
                  resolve(blob);
                } else {
                  resolve(file);
                }
              },
              file.type === "image/png" ? "image/png" : "image/jpeg",
              quality
            );
          } else {
            clearTimeout(timeout);
            resolve(file);
          }
        } catch {
          clearTimeout(timeout);
          resolve(file);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(file);
      };

      reader.readAsDataURL(file);
    } catch {
      resolve(file);
    }
  });
}

export function generateSafeFilename(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpeg", "jpg", "png", "webp"].includes(ext) ? ext : "jpg";
  const uniqueId = Math.random().toString(36).substring(2, 12);
  const timestamp = Date.now();
  return `${timestamp}_${uniqueId}.${safeExt}`;
}

/**
 * Upload Image to Firebase Storage with automatic timeout & DataURL fallback
 * Ensures upload never stalls or blocks submission if Firebase Storage rules or network fail.
 */
export async function uploadReportImage(
  userId: string,
  reportId: string,
  file: Blob,
  originalFilename: string
): Promise<string> {
  const validation = validateImageUpload({
    type: file.type || "image/jpeg",
    size: file.size,
    name: originalFilename,
  });

  if (!validation.valid) {
    throw new Error(validation.error || "Image validation failed");
  }

  const convertToDataUrl = (): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const storage = getFirebaseStorage();
  const safeFilename = generateSafeFilename(originalFilename);
  const storagePath = `reports/${userId}/${reportId}/${safeFilename}`;

  if (!storage) {
    logger.warn("Firebase Storage client not initialized. Converting to DataURL.", "StorageUtils");
    return convertToDataUrl();
  }

  // Attempt Firebase Storage with 4-second timeout race
  try {
    const uploadPromise = (async () => {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || "image/jpeg",
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      logger.info("Image uploaded successfully to Firebase Storage", "StorageUtils", { storagePath });
      return downloadUrl;
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Storage upload timed out")), 4000)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (err: any) {
    logger.warn("Firebase Storage direct upload failed or timed out. Falling back to DataURL for seamless persistence.", "StorageUtils", err);
    return convertToDataUrl();
  }
}
