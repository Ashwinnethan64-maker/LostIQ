import { ItemCategory } from "@/types";

/**
 * Strict Category Compatibility Map
 * Enforces hard gates so bags NEVER match electronics, wallets NEVER match bottles, etc.
 */
export const CATEGORY_COMPATIBILITY: Record<ItemCategory, ItemCategory[]> = {
  bags_backpacks: ["bags_backpacks"],
  electronics: ["electronics"],
  id_cards: ["id_cards"],
  keys: ["keys"],
  bottles_tumblers: ["bottles_tumblers"],
  clothing_apparel: ["clothing_apparel"],
  books_stationery: ["books_stationery"],
  jewelry_watches: ["jewelry_watches"],
  other: ["other", "bags_backpacks", "electronics", "id_cards", "keys", "bottles_tumblers", "clothing_apparel", "books_stationery", "jewelry_watches"],
};

/**
 * Returns true only if category A and category B are compatible.
 */
export function areCategoriesCompatible(catA: ItemCategory, catB: ItemCategory): boolean {
  if (!catA || !catB) return false;
  if (catA === catB) return true;
  return Boolean(CATEGORY_COMPATIBILITY[catA]?.includes(catB) || CATEGORY_COMPATIBILITY[catB]?.includes(catA));
}
