import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchFlavorDictionary, fetchWine, fetchWineTastes } from './api.js';
import { flattenDictionary, matchTopNote, resolveGuess, topFlavorNotes } from './game.js';
import { bottleImageUrl } from './wine.js';
import GuessInput from './GuessInput.jsx';
import WineSearch from './WineSearch.jsx';

const LANG = new URLSearchParams(window.location.search).get('lang') || 'en';

const wineIdFromUrl = () => new URLSearchParams(window.location.search).get('wine_id');

// Picks the wine: ?wine_id=<id> if given, otherwise a search. The wine ID is
// kept in the URL so a game can be shared and the back button works.
export default function App() {
  const [wineId, setWineId] = useState(wineIdFromUrl);
  // The search result the player picked, so the header can show right away.
  const [pickedWine, setPickedWine] = useState(null);

  useEffect(() => {
    const onPopState = () => {
      setWineId(wineIdFromUrl());
      setPickedWine(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function changeWine(wine) {
    const url = new URL(window.location.href);
    if (wine) url.searchParams.set('wine_id', wine.id);
    else url.searchParams.delete('wine_id');
    window.history.pushState(null, '', url);
    setWineId(wine ? String(wine.id) : null);
    setPickedWine(wine);
  }

  if (!wineId) {
    return (
      <main className="app">
        <header>
          <p className="eyebrow">Guess the flavor notes</p>
          <p className="muted">Pick a wine to play with.</p>
        </header>
        <WineSearch lang={LANG} onSelect={changeWine} />
      </main>
    );
  }

  // Keyed by wine ID so all game state resets when the wine changes.
  return <Game key={wineId} wineId={wineId} initialWine={pickedWine} onClear={() => changeWine(null)} />;
}

function Game({ wineId, initialWine, onClear }) {
  const [state, setState] = useState({ status: 'loading' });
  const [revealed, setRevealed] = useState(() => new Set());
  const [misses, setMisses] = useState([]);
  const [gaveUp, setGaveUp] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // The wine itself is only used for its name and bottle, so a failure there
    // shouldn't block the game: fall back to the picked search result, or the ID.
    const wine = fetchWine(wineId, LANG).catch(() => initialWine);
    Promise.all([
      fetchWineTastes(wineId, LANG),
      fetchFlavorDictionary(LANG),
      wine,
    ])
      .then(([tastes, dict, wine]) => {
        if (!cancelled) setState({ status: 'ready', tastes, dict, wine });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', message: `Couldn't load wine ${wineId}: ${err.message}` });
      });
    return () => {
      cancelled = true;
    };
  }, [wineId, initialWine]);

  const topNotes = useMemo(() => (state.status === 'ready' ? topFlavorNotes(state.tastes) : []), [state]);
  const words = useMemo(() => (state.status === 'ready' ? flattenDictionary(state.dict) : []), [state]);

  const lastMissText = useCallback((miss) => {
    let text = `“${miss}” isn't in the top ${topNotes.length}`

    if (state.tastes) {
      let taste = state.tastes.values().find((t) => t.name === miss)
      if (taste && taste.count > 0) {
        text += `, but ${taste.count} people mentioned it`
      }
    }
    return text
  }, [state.tastes])

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
    return (
      <main className="app">
        <p className="error">{state.message}</p>
        <button className="link" onClick={onClear}>Search for a wine</button>
      </main>
    );
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
            <h1>{wineName || `Wine ${wineId}`}</h1>
            {wineName && wineryName && <p className="winery">{wineryName}</p>}
            <button className="link" onClick={onClear}>Choose a different wine</button>
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
                {lastMissText(misses[misses.length - 1])}
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
