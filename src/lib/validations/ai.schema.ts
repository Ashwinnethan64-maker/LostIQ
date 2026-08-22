import { z } from "zod";

export const AIAttributesSchema = z.object({
  summary: z.string().min(1, "Summary is required"),
  category: z.string().default("other"),
  objectType: z.string().default("item"),
  brand: z.string().default("Unknown"),
  color: z.string().default("unspecified"),
  attributes: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  extractedAt: z.string().datetime().or(z.string()),
});

export type ValidatedAIAttributes = z.infer<typeof AIAttributesSchema>;
