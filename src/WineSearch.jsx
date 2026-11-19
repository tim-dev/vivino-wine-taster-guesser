import { useEffect, useState } from 'react';
import { searchWines } from './api.js';
import { bottleImageUrl, searchResultWines } from './wine.js';

const DEBOUNCE_MS = 250;

// Search box for picking a wine. Calls onSelect(wine) when a result is chosen.
export default function WineSearch({ lang, onSelect }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ status: 'idle', wines: [] });

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setState({ status: 'idle', wines: [] });
      return;
    }
    // Debounce typing, and abort a stale request when the query changes.
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, status: 'loading' }));
      searchWines(q, lang, controller.signal)
        .then((res) => setState({ status: 'done', wines: searchResultWines(res) }))
        .catch((err) => {
          if (err.name !== 'AbortError') setState({ status: 'error', wines: [], message: err.message });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, lang]);

  return (
    <section className="wine-search">
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          value={query}
          placeholder="Search for a wine, e.g. Barolo"
          aria-label="Search for a wine"
          autoComplete="off"
          spellCheck="false"
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {state.status === 'loading' && state.wines.length === 0 && <p className="muted">Searching…</p>}
      {state.status === 'error' && <p className="error">Search failed: {state.message}</p>}
      {state.status === 'done' && state.wines.length === 0 && (
        <p className="muted">No wines found for “{query.trim()}”.</p>
      )}

      {state.wines.length > 0 && (
        <ul className={`results ${state.status === 'loading' ? 'stale' : ''}`}>
          {state.wines.map((wine) => (
            <li key={wine.id}>
              <button type="button" className="result" onClick={() => onSelect(wine)}>
                <ResultBottle wine={wine} />
                <span className="result-text">
                  <span className="result-name">{wine.name || `Wine ${wine.id}`}</span>
                  {wine.winery?.name && <span className="result-winery">{wine.winery.name}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ResultBottle({ wine }) {
  const [failed, setFailed] = useState(false);
  const url = bottleImageUrl(wine, ['bottle_small', 'bottle_medium', 'bottle_large']);
  if (!url || failed) return <span className="result-bottle" aria-hidden="true" />;
  return <img className="result-bottle" src={url} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
