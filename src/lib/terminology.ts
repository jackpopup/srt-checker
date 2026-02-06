import { TermEntry } from "@/types/term";
import * as bkend from "./bkend";

// In-memory cache
let cachedTerms: TermEntry[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export async function getAllTerms(): Promise<TermEntry[]> {
  const now = Date.now();
  if (cachedTerms && now - cacheTime < CACHE_TTL) {
    return cachedTerms;
  }

  try {
    const terms = await bkend.getTerms();
    if (terms.length > 0) {
      cachedTerms = terms;
      cacheTime = now;
      return terms;
    }
  } catch (e) {
    console.error("Failed to fetch terms from bkend:", e);
  }

  // Fallback: load from built-in dictionary
  return getBuiltinTerms();
}

export function getBuiltinTerms(): TermEntry[] {
  // Fallback dictionary bundled in src/data
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dict = require("@/data/terminology-dictionary.json");
    return dict.terms || [];
  } catch (error) {
    console.warn("Failed to load builtin terms:", error);
    return [];
  }
}

export async function searchTerms(
  query: string,
  category?: string
): Promise<TermEntry[]> {
  const all = await getAllTerms();
  const q = query.toLowerCase();

  return all.filter((t) => {
    if (category && t.category !== category) return false;
    if (!query) return true;

    return (
      t.term.toLowerCase().includes(q) ||
      t.aliases.some((a) => a.toLowerCase().includes(q)) ||
      t.description.toLowerCase().includes(q)
    );
  });
}

/**
 * Build a compact terminology string for Claude prompt.
 * Groups by category, only includes term + aliases.
 * Keeps under ~2000 tokens.
 */
export function buildTermDictForPrompt(terms: TermEntry[]): string {
  // Priority: company products first, then others
  const priorityCategories = [
    "company",
    "product",
    "product_feature",
    "vc_company",
    "vibe_coding",
    "ai_tool",
  ];

  const lines: string[] = [];

  for (const cat of priorityCategories) {
    const catTerms = terms.filter((t) => t.category === cat);
    if (catTerms.length === 0) continue;

    const entries = catTerms.map((t) => {
      if (t.aliases.length > 0) {
        return `${t.term}(${t.aliases.slice(0, 4).join(",")})`;
      }
      return t.term;
    });

    lines.push(entries.join(", "));
  }

  return lines.join("\n");
}

export function invalidateCache() {
  cachedTerms = null;
  cacheTime = 0;
}
