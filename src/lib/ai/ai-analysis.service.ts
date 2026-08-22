import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";
import { logger } from "../logger";
import { AIRawAttributes } from "@/types";
import { AIAttributesSchema } from "../validations/ai.schema";

export class AIAnalysisService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.gemini.apiKey) {
      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    }
  }

  /**
   * Performs multimodal analysis on an item report (image + text)
   * Returns validated, structured JSON attributes with fallback resilience.
   */
  async analyzeItem(params: {
    title: string;
    description: string;
    category: string;
    imageBase64OrUrl?: string | null;
  }): Promise<AIRawAttributes> {
    const { title, description, category, imageBase64OrUrl } = params;

    const fallback: AIRawAttributes = this.buildHeuristicAttributes(title, description, category);

    if (!this.genAI) {
      logger.warn("Gemini API key not configured. Using deterministic heuristic extraction.", "AIAnalysisService");
      return fallback;
    }

    // Attempt with retry
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: config.gemini.model || "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" },
        });

        const prompt = `You are the lead multimodal AI recognition agent for LostIQ (Intelligent Lost & Found).
Extract structured attributes from this campus item report. Return ONLY a valid JSON object matching this schema:
{
  "summary": "Concise 1-2 sentence description of item visual appearance, condition, and identity.",
  "category": "electronics | id_cards | keys | bags_backpacks | bottles_tumblers | clothing_apparel | books_stationery | jewelry_watches | other",
  "objectType": "Item noun phrase (e.g., wireless earbuds, stainless water bottle, backpack, student id)",
  "brand": "Detected brand or 'Unknown'",
  "color": "Dominant color(s) (e.g., black, matte gray, navy blue)",
  "attributes": ["specific", "visual", "or", "physical", "features", "such", "as", "scratches", "stickers", "keychains"],
  "keywords": ["searchable", "synonyms", "and", "tags"]
}

Item Details:
Title: ${title}
Description: ${description}
User Selected Category: ${category}
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

        const result = await model.generateContent(contents);
        const text = result.response.text();
        const parsedJson = JSON.parse(text);

        const validated = AIAttributesSchema.safeParse({
          ...parsedJson,
          extractedAt: new Date().toISOString(),
        });

        if (validated.success) {
          logger.info("AI item analysis successfully parsed & validated", "AIAnalysisService", {
            objectType: validated.data.objectType,
            brand: validated.data.brand,
          });
          return validated.data;
        } else {
          logger.warn("AI output failed schema validation. Sanitizing fields.", "AIAnalysisService", validated.error);
          return {
            summary: parsedJson.summary || fallback.summary,
            category: parsedJson.category || fallback.category,
            objectType: parsedJson.objectType || fallback.objectType,
            brand: parsedJson.brand || fallback.brand,
            color: parsedJson.color || fallback.color,
            attributes: Array.isArray(parsedJson.attributes) ? parsedJson.attributes : fallback.attributes,
            keywords: Array.isArray(parsedJson.keywords) ? parsedJson.keywords : fallback.keywords,
            extractedAt: new Date().toISOString(),
          };
        }
      } catch (err) {
        logger.error(`AI analysis attempt ${attempt} failed`, "AIAnalysisService", err);
        if (attempt === 2) {
          return fallback;
        }
      }
    }

    return fallback;
  }

  private buildHeuristicAttributes(title: string, description: string, category: string): AIRawAttributes {
    const combined = `${title} ${description}`.toLowerCase();
    
    // Brand detection
    const knownBrands = ["apple", "sony", "samsung", "hydro flask", "stanley", "dell", "lenovo", "anker", "nike", "yeti", "jbl", "bose", "north face", "patagonia", "casio"];
    let detectedBrand = "Unknown";
    for (const b of knownBrands) {
      if (combined.includes(b)) {
        detectedBrand = b.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        break;
      }
    }

    // Color detection
    const knownColors = ["black", "white", "navy blue", "blue", "red", "green", "silver", "gray", "gold", "yellow", "purple", "pink", "orange", "brown"];
    let detectedColor = "unspecified";
    for (const c of knownColors) {
      if (combined.includes(c)) {
        detectedColor = c;
        break;
      }
    }

    const words = Array.from(new Set(combined.split(/[^a-zA-Z0-9]+/))).filter((w) => w.length > 3);

    return {
      summary: `${title} - ${description.slice(0, 120)}`,
      category: category || "other",
      objectType: title.split(" ").slice(0, 3).join(" "),
      brand: detectedBrand,
      color: detectedColor,
      attributes: [category, detectedColor !== "unspecified" ? detectedColor : "", detectedBrand !== "Unknown" ? detectedBrand : ""].filter(Boolean),
      keywords: words.slice(0, 8),
      extractedAt: new Date().toISOString(),
    };
  }
}

export const aiAnalysisService = new AIAnalysisService();
