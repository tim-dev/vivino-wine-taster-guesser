import { useId, useMemo, useState } from 'react';
import { suggest } from './game.js';

// Text box with an autocomplete list drawn from the flavor dictionary.
// Calls onGuess(text, word): word is the dictionary entry the player picked,
// or null when they submit free text.
export default function GuessInput({ words, onGuess, disabled }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const suggestions = useMemo(() => suggest(words, text), [words, text]);
  const showList = open && suggestions.length > 0;

  function submit(word) {
    const value = word ? word.name : text;
    if (!value.trim()) return;
    onGuess(value, word ?? null);
    setText('');
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit(showList && active >= 0 ? suggestions[active] : null);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <form
      className="guess-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit(null);
      }}
    >
      <div className="combo">
        <input
          type="text"
          value={text}
          placeholder="Guess a flavor, e.g. cherry"
          autoComplete="off"
          spellCheck="false"
          disabled={disabled}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {showList && (
          <ul className="suggestions" id={listId} role="listbox">
            {suggestions.map((w, i) => (
              <li
                key={w.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'active' : undefined}
                // mousedown fires before the input's blur, so the click lands.
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit(w);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span>{w.name}</span>
                <span className="group">{w.group}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" disabled={disabled || !text.trim()}>
        Guess
      </button>
    </form>
  );
}
