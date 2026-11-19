// Pure game logic: no React, no fetching.

export const TOP_N = 5;
const MAX_SUGGESTIONS = 8;

const normalize = (s) => (s || '').trim().toLocaleLowerCase();

// Top N flavor notes by count, across all flavor groups. A keyword can show up
// both as primary and secondary, so dedupe by ID and keep the highest count.
export function topFlavorNotes(tastes, n = TOP_N) {
  const byId = new Map();
  for (const group of tastes?.flavor ?? []) {
    const keywords = [...(group.primary_keywords ?? []), ...(group.secondary_keywords ?? [])];
    for (const kw of keywords) {
      const existing = byId.get(kw.id);
      if (!existing || kw.count > existing.count) {
        byId.set(kw.id, { id: kw.id, name: kw.name, count: kw.count, group: group.group });
      }
    }
  }
  return [...byId.values()].sort((a, b) => b.count - a.count).slice(0, n);
}

// Flatten the dictionary into one list of words, each with lower-cased search
// terms (name plus aliases).
export function flattenDictionary(dict) {
  const words = [];
  for (const group of dict?.flavors ?? []) {
    for (const w of group.words ?? []) {
      const aliases = (w.aliases ?? []).filter(Boolean);
      words.push({
        id: w.id,
        name: w.name,
        group: group.group,
        terms: [w.name, ...aliases].map(normalize),
      });
    }
  }
  words.sort((a, b) => a.name.localeCompare(b.name));
  return words;
}

// Words whose name or alias contains the query. Prefix matches come first.
export function suggest(words, query, limit = MAX_SUGGESTIONS) {
  const q = normalize(query);
  if (!q) return [];
  const prefix = [];
  const contains = [];
  for (const w of words) {
    if (w.terms.some((t) => t.startsWith(q))) prefix.push(w);
    else if (w.terms.some((t) => t.includes(q))) contains.push(w);
    if (prefix.length >= limit) break;
  }
  return [...prefix, ...contains].slice(0, limit);
}

// Resolve free text to a dictionary word by exact name or alias match.
export function resolveGuess(words, text) {
  const q = normalize(text);
  if (!q) return null;
  return words.find((w) => w.terms.includes(q)) ?? null;
}

// Return the top note matched by this guess, or null. Matches by ID, and falls
// back to name in case the two responses ever disagree on IDs.
export function matchTopNote(topNotes, word, text) {
  if (word) {
    const byId = topNotes.find((n) => n.id === word.id);
    if (byId) return byId;
  }
  const q = normalize(word?.name ?? text);
  return topNotes.find((n) => normalize(n.name) === q) ?? null;
}
