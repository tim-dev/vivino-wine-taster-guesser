# Guess the Flavor Notes

A small React game: try to name the 5 flavor notes reviewers mention most for a wine.

## Run

```sh
npm install
npm run dev
# open http://localhost:5173/?wine_id=1234
```

Query params:

- `wine_id` (required): the wine to play with.
- `lang` (optional, default `en`): language for the autocomplete words and note names.

By default API calls are proxied to a local go-api at `http://localhost:9000`. To use a different
one, set `VITE_API_TARGET`:

```sh
VITE_API_TARGET=https://some-go-api-host npm run dev
```

## Data

- `GET /wines/:id/tastes`: flavor groups with `primary_keywords` / `secondary_keywords`
  (`{id, name, count}`). The top 5 by count across all groups are the answers.
- `GET /wines/:id`: the wine's `name` and `winery.name`, shown in the header (falls back to the ID).
- `GET /tastes/languages/:lang/detection_rules`: the full flavor dictionary
  (`{flavors: [{group, words: [{id, name, aliases}]}]}`), used for autocomplete.

Guesses are checked by flavor ID, so a guess counts if it matches an answer's name or any of its aliases.
