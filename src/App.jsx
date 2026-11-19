import { useEffect, useMemo, useState } from 'react';
import { fetchFlavorDictionary, fetchWine, fetchWineTastes } from './api.js';
import { flattenDictionary, matchTopNote, resolveGuess, topFlavorNotes } from './game.js';
import GuessInput from './GuessInput.jsx';

// The wine response's image shape isn't pinned down, so try the usual
// Vivino layouts: image.variations.bottle_* first, then image.location.
// Vivino image URLs are often protocol-relative ("//images.vivino.com/...").
function bottleImageUrl(wine) {
  const image = wine?.image;
  const v = image?.variations;
  const url = v?.bottle_medium || v?.bottle_large || v?.bottle_small || image?.location;
  if (typeof url !== 'string' || !url) return null;
  return url.startsWith('//') ? `https:${url}` : url;
}

const params = new URLSearchParams(window.location.search);
const WINE_ID = params.get('wine_id');
const LANG = params.get('lang') || 'en';

export default function App() {
  const [state, setState] = useState({ status: 'loading' });
  const [revealed, setRevealed] = useState(() => new Set());
  const [misses, setMisses] = useState([]);
  const [gaveUp, setGaveUp] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!WINE_ID) {
      setState({ status: 'error', message: 'Add ?wine_id=<id> to the URL to start.' });
      return;
    }
    let cancelled = false;
    // The wine itself is only used for its name, so a failure there shouldn't
    // block the game: fall back to showing the ID.
    const wine = fetchWine(WINE_ID, LANG).catch(() => null);
    Promise.all([fetchWineTastes(WINE_ID, LANG), fetchFlavorDictionary(LANG), wine])
      .then(([tastes, dict, wine]) => {
        if (!cancelled) setState({ status: 'ready', tastes, dict, wine });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', message: `Couldn't load wine ${WINE_ID}: ${err.message}` });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const topNotes = useMemo(() => (state.status === 'ready' ? topFlavorNotes(state.tastes) : []), [state]);
  const words = useMemo(() => (state.status === 'ready' ? flattenDictionary(state.dict) : []), [state]);

  const wineName = state.wine?.name;
  const wineryName = state.wine?.winery?.name;
  const bottleUrl = bottleImageUrl(state.wine);

  const won = topNotes.length > 0 && revealed.size === topNotes.length;
  const finished = won || gaveUp;

  function handleGuess(text, pickedWord) {
    const word = pickedWord ?? resolveGuess(words, text);
    const hit = matchTopNote(topNotes, word, text);
    if (hit) {
      setRevealed((prev) => new Set(prev).add(hit.id));
    } else {
      setMisses((prev) => [...prev, word?.name ?? text.trim()]);
    }
  }

  if (state.status === 'loading') {
    return <main className="app"><p className="muted">Loading…</p></main>;
  }
  if (state.status === 'error') {
    return <main className="app"><p className="error">{state.message}</p></main>;
  }

  return (
    <main className="app">
      <header>
        <p className="eyebrow">Guess the flavor notes</p>
        <div className="wine">
          {bottleUrl && !imageFailed && (
            <img className="bottle" src={bottleUrl} alt="" onError={() => setImageFailed(true)} />
          )}
          <div>
            <h1>{wineName || `Wine ${WINE_ID}`}</h1>
            {wineName && wineryName && <p className="winery">{wineryName}</p>}
          </div>
        </div>
        <p className="muted">Name the {topNotes.length} flavors reviewers mention most.</p>
      </header>

      {topNotes.length === 0 ? (
        <p className="muted">This wine doesn't have any flavor notes yet.</p>
      ) : (
        <>
          <ol className="board">
            {topNotes.map((note, i) => {
              const shown = revealed.has(note.id) || gaveUp;
              const missed = gaveUp && !revealed.has(note.id);
              return (
                <li key={note.id} className={`slot ${shown ? 'shown' : ''} ${missed ? 'missed' : ''}`}>
                  <span className="rank">{i + 1}</span>
                  <span className="name">{shown ? note.name : '?'}</span>
                  <span className="count">{shown ? `${note.count} mentions` : ''}</span>
                </li>
              );
            })}
          </ol>

          <GuessInput words={words} onGuess={handleGuess} disabled={finished} />

          {misses.length > 0 && (
            <div className="misses" aria-live="polite">
              <div className="xs" aria-hidden="true">
                {misses.map((_, i) => (
                  <span key={i} className="x">✕</span>
                ))}
              </div>
              <p className="muted">
                “{misses[misses.length - 1]}” isn't in the top {topNotes.length}.
              </p>
            </div>
          )}

          <footer>
            {won && <p className="win">You got all {topNotes.length}! 🍷</p>}
            {!finished && (
              <button className="link" onClick={() => setGaveUp(true)}>
                Reveal answers
              </button>
            )}
          </footer>
        </>
      )}
    </main>
  );
}
