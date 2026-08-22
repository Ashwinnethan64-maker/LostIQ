import crypto from "crypto";

export interface OwnershipProofVerificationResult {
  passed: boolean;
  score: number;
  reason?: string;
}

/**
 * Normalizes input strings for secure, tolerant ownership comparison.
 * Collapses whitespace, converts to lowercase, and strips non-alphanumeric noise.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Evaluates submitted claimant answers against the original private ownership proof.
 * Uses exact token extraction, keyword set intersection, and substring density.
 */
export function verifyOwnershipProof(
  storedProof: string,
  submittedAnswer: string
): OwnershipProofVerificationResult {
  const normStored = normalizeText(storedProof);
  const normAnswer = normalizeText(submittedAnswer);

  if (!normStored || !normAnswer) {
    return { passed: false, score: 0, reason: "Missing proof context" };
  }

  // Exact or direct inclusion match
  if (normStored === normAnswer || normStored.includes(normAnswer) || normAnswer.includes(normStored)) {
    return { passed: true, score: 100 };
  }

  // Tokenize words (ignoring common short stop words)
  const stopWords = new Set(["the", "and", "with", "that", "this", "from", "item", "has", "have", "near", "side", "inside"]);
  const storedTokens = normStored.split(" ").filter((w) => w.length > 2 && !stopWords.has(w));
  const answerTokens = normAnswer.split(" ").filter((w) => w.length > 2 && !stopWords.has(w));

  if (storedTokens.length === 0 || answerTokens.length === 0) {
    return { passed: false, score: 0, reason: "Insufficient distinctive tokens" };
  }

  let matches = 0;
  for (const token of answerTokens) {
    if (storedTokens.some((st) => st === token || st.includes(token) || token.includes(st))) {
      matches++;
    }
  }

  const overlapRatio = matches / Math.min(storedTokens.length, answerTokens.length);
  const score = Math.round(overlapRatio * 100);

  // Requirement: at least 50% distinctive keyword overlap to pass
  if (score >= 50 && matches >= 1) {
    return { passed: true, score };
  }

  return {
    passed: false,
    score,
    reason: "Submitted verification characteristics do not match the registered private proof",
  };
}

/**
 * Generates an opaque, cryptographically secure recovery token.
 */
export function generateRecoveryToken(): { token: string; hash: string } {
  const rawBytes = crypto.randomBytes(24);
  const token = `LQ-${rawBytes.toString("hex").toUpperCase()}`;
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

/**
 * Validates a hash against a token.
 */
export function hashRecoveryToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
