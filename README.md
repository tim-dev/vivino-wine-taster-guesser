# Guess the Flavor Notes

A small React game: try to name the 5 flavor notes reviewers mention most for a wine.

## Run

```sh
npm install
npm run dev
# open http://localhost:5173/?wine_id=1234
```

Query params:

- `wine_id` (optional): the wine to play with. Without it, the page shows a wine search; picking a
  result sets `wine_id` in the URL, and "Choose a different wine" clears it.
- `lang` (optional, default `en`): language for the autocomplete words and note names.

`npm run dev` starts an Express server (`server/index.js`) that runs Vite as middleware for the
frontend and proxies `/api/*` to go-api (`server/app.js`). By default the proxy targets a local
go-api at `http://localhost:9000`. To use a different one, set `API_TARGET` (in the shell or in
`.env.local`):

```sh
API_TARGET=https://some-go-api-host npm run dev
```

To run a production build locally:

```sh
npm run build
npm start
```

## Deploy (Vercel)

`vercel.json` builds the frontend with Vite into `dist/` and rewrites `/api/*` to the serverless
function `api/index.js`, which runs the same Express app as the local server.

1. Import the repo in Vercel, or run `npx vercel` from the project root.
2. Set the `API_TARGET` environment variable in the Vercel project settings to the go-api URL.
   The URL must be reachable from Vercel, so `localhost` won't work.
3. Deploy (`npx vercel --prod`, or push to the connected branch).

## Data

- `GET /wines/:id/tastes`: flavor groups with `primary_keywords` / `secondary_keywords`
  (`{id, name, count}`). The top 5 by count across all groups are the answers.
- `GET /wines/:id`: the wine's `name` and `winery.name`, shown in the header (falls back to the ID).
- `GET /wines/_find?q=<text>`: wine search, used when no `wine_id` is given. Each result shows its
  bottle image, name, and winery name.
- `GET /tastes/languages/:lang/detection_rules`: the full flavor dictionary
  (`{flavors: [{group, words: [{id, name, aliases}]}]}`), used for autocomplete.

Guesses are checked by flavor ID, so a guess counts if it matches an answer's name or any of its aliases.
