// Helpers for reading wine objects from go-api responses.

// The wine response's image shape isn't pinned down, so try the usual
// Vivino layouts: image.variations.bottle_* first, then image.location.
// Vivino image URLs are often protocol-relative ("//images.vivino.com/...").
export function bottleImageUrl(wine, sizes = ['bottle_medium', 'bottle_large', 'bottle_small']) {
  const image = wine?.image;
  const v = image?.variations;
  const url = sizes.map((s) => v?.[s]).find(Boolean) || image?.location;
  if (typeof url !== 'string' || !url) return null;
  return url.startsWith('//') ? `https:${url}` : url;
}

// The search response's shape isn't pinned down either: accept a bare array or
// an object holding one, with items that are wines or wrap one
// ({ wine } / { vintage: { wine } }). Drops anything without an ID.
export function searchResultWines(res) {
  const list = Array.isArray(res)
    ? res
    : [res?.wines, res?.matches, res?.items, res?.results, res?.records].find(Array.isArray) ?? [];
  const seen = new Set();
  const wines = [];
  for (const item of list) {
    const wine = item?.wine ?? item?.vintage?.wine ?? item;
    if (wine?.id == null || seen.has(wine.id)) continue;
    seen.add(wine.id);
    wines.push(wine);
  }
  return wines;
}
