import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";
import { logger } from "../logger";
import { AIRawAttributes } from "@/types";

export interface AIAnalysisResult {
  summary: string;
  category: string;
  objectType: string;
  brand: string;
  dominantColor: string;
  attributes: string[];
  keywords: string[];
}

export async function analyzeItemWithGemini(
  title: string,
  description: string,
  category: string,
  imageBase64OrUrl?: string | null
): Promise<AIRawAttributes> {
  const defaultFallback: AIRawAttributes = {
    summary: `${title} - ${description.slice(0, 100)}`,
    category: category,
    objectType: title.split(" ")[0] || "item",
    brand: extractBrandHeuristic(title + " " + description),
    color: extractColorHeuristic(title + " " + description),
    attributes: [category, title],
    keywords: Array.from(new Set([...title.toLowerCase().split(/\s+/), ...description.toLowerCase().split(/\s+/)])).filter(
      (w) => w.length > 3
    ),
    extractedAt: new Date().toISOString(),
  };

  if (!config.gemini.apiKey) {
    logger.warn("GEMINI_API_KEY missing. Using heuristic structured attribute extractor.", "GeminiAI");
    return defaultFallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: config.gemini.model || "gemini-1.5-flash" });

    const prompt = `You are the AI item identification engine for LostIQ (Intelligent Lost & Found).
Analyze this lost/found report and return ONLY valid JSON matching this exact structure:
{
  "summary": "Short concise visual and functional summary (1-2 sentences)",
  "category": "electronics | id_cards | keys | bags_backpacks | bottles_tumblers | clothing_apparel | books_stationery | jewelry_watches | other",
  "objectType": "specific item type (e.g. wireless earbuds, water bottle, backpack, id card)",
  "brand": "Identified brand name or 'Unknown'",
  "dominantColor": "primary color (e.g. black, navy blue, silver)",
  "attributes": ["array", "of", "distinctive", "visual", "or", "physical", "features", "stickers", "scratches"],
  "keywords": ["array", "of", "relevant", "search", "tags", "and", "synonyms"]
}

Item Details:
Title: ${title}
Description: ${description}
Category: ${category}
`;

    const contents: any[] = [prompt];

    if (imageBase64OrUrl && imageBase64OrUrl.startsWith("data:image/")) {
      const mimeMatch = imageBase64OrUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64Data = imageBase64OrUrl.split(",")[1];
      if (base64Data) {
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      }
    }

    const response = await model.generateContent(contents);
    const text = response.response.text();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed: AIAnalysisResult = JSON.parse(cleanJson);

    return {
      summary: parsed.summary || defaultFallback.summary,
      category: parsed.category || defaultFallback.category,
      objectType: parsed.objectType || defaultFallback.objectType,
      brand: parsed.brand || defaultFallback.brand,
      color: parsed.dominantColor || defaultFallback.color,
      attributes: Array.isArray(parsed.attributes) ? parsed.attributes : defaultFallback.attributes,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : defaultFallback.keywords,
      extractedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error("Gemini AI extraction error, falling back to heuristics safely", "GeminiAI", err);
    return defaultFallback;
  }
}

function extractBrandHeuristic(text: string): string {
  const lower = text.toLowerCase();
  const brands = ["apple", "sony", "samsung", "hydro flask", "stanley", "dell", "lenovo", "anker", "nike", "yeti", "jbl", "bose"];
  for (const b of brands) {
    if (lower.includes(b)) return b.charAt(0).toUpperCase() + b.slice(1);
  }
  return "Unknown";
}

function extractColorHeuristic(text: string): string {
  const lower = text.toLowerCase();
  const colors = ["black", "white", "navy blue", "blue", "red", "green", "silver", "gray", "gold", "yellow", "purple", "pink"];
  for (const c of colors) {
    if (lower.includes(c)) return c;
  }
  return "unspecified";
}
