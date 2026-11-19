// Thin wrappers around the three go-api endpoints the game needs.
//
//   GET /wines/:id/tastes                      -> TasteFull
//     { structure, flavor: [{ group, stats, primary_keywords: [{id, name, count}], secondary_keywords: [...] }] }
//
//   GET /wines/:id                             -> FullWine
//     { id, name, winery: { name }, ... }
//
//   GET /tastes/languages/:lang/detection_rules -> FlavorDict
//     { flavors: [{ group, words: [{ id, name, aliases: [] }] }] }
//
//   GET /wines/_find?q=<text>                  -> wine search results (see searchResultWines)
//
// Flavor IDs are shared between the tastes and dictionary responses, so guesses are checked by ID.

async function getJSON(path, lang, signal) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`/api${path}${sep}language=${encodeURIComponent(lang)}`, {
    headers: { Accept: 'application/json', 'Accept-Language': lang },
    signal,
  });
  if (res.status === 404) {
    throw new Error('Not found');
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

export function fetchWineTastes(wineId, lang) {
  return getJSON(`/wines/${encodeURIComponent(wineId)}/tastes`, lang);
}

export function fetchFlavorDictionary(lang) {
  return getJSON(`/tastes/languages/${encodeURIComponent(lang)}/detection_rules`, lang);
}

export function fetchWine(wineId, lang) {
  return getJSON(`/wines/${encodeURIComponent(wineId)}`, lang);
}

export function searchWines(query, lang, signal) {
  return getJSON(`/wines/_find?q=${encodeURIComponent(query)}`, lang, signal);
}
