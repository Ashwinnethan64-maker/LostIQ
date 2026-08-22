import { z } from "zod";

export const ItemCategoryEnum = z.enum([
  "electronics",
  "id_cards",
  "keys",
  "bags_backpacks",
  "bottles_tumblers",
  "clothing_apparel",
  "books_stationery",
  "jewelry_watches",
  "other",
]);

export const ReportSubmissionSchema = z.object({
  reportType: z.enum(["LOST", "FOUND"]),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),
  description: z
    .string()
    .min(10, "Please provide a detailed description (at least 10 characters)")
    .max(1000, "Description must not exceed 1000 characters"),
  category: ItemCategoryEnum,
  locationName: z
    .string()
    .min(3, "Location name is required (e.g. Central Library 2nd Floor)"),
  locationZone: z.string().optional(),
  reportedDate: z.string().min(1, "Date is required"),
  reportedTime: z.string().min(1, "Time is required"),
  imageUrl: z.string().optional().nullable(),
});

export type ReportSubmissionInput = z.infer<typeof ReportSubmissionSchema>;
