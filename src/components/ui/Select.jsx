'use client';

import {
  Children, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Select — the site's dropdown, drawn in HTML rather than by the browser.
 *
 * It used to be a native <select>. The problem with that is the open list: on
 * Windows and macOS, Chrome and Edge hand it to the operating system, which
 * ignores every style on <option> — the rows could not be given room, could
 * not show which one was chosen in the site's own colour, and a city list of
 * a hundred-odd names could not be searched. None of that is reachable from
 * CSS, so the list is built here instead.
 *
 * It keeps the native control's contract so nothing that used it had to
 * change: `value`, `onChange(event)` with `event.target.value`, and options
 * either as an `options` array or as <option> children. A `name` still posts
 * with a form, through a hidden input.
 *
 * The open list is portalled to <body> and positioned against the trigger.
 * Rendered in place it would be clipped by whatever scrolls around it — the
 * filter sidebar is its own scroller, and a list opened near its foot would
 * be cut off at the sidebar's edge.
 *
 * Keyboard: ↑/↓ and Home/End move, Enter chooses, Escape closes and returns
 * focus to the trigger, Tab closes. Long lists get a search box, and typing
 * in it narrows the list as you go.
 *
 * @param {object} props
 * @param {string} [props.value]
 * @param {(e: {target: {value: string, name?: string}}) => void} [props.onChange]
 * @param {Array<string|{value:string,label:string,disabled?:boolean}>} [props.options]
 * @param {string} [props.placeholder]     shown when nothing matches `value`; not choosable
 * @param {'md'|'sm'|'xs'} [props.size='md']
 * @param {boolean} [props.bare=false]     no border, fill or sizing — for a
 *   dropdown that sits inside a shape its caller has already drawn
 * @param {boolean} [props.searchable]     defaults to on for more than eight options
 * @param {import('react').ReactNode} [props.leftIcon]  drawn inside the trigger
 * @param {boolean} [props.invalid=false]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]       classes for the trigger
 * @param {string} [props.wrapperClassName]
 * @param {string} [props.chevronClassName]
 */

/**
 * Trigger sizing per size. Kept whole and never mixed with a caller's classes:
 * `cn` is a plain join, not tailwind-merge, so `h-11` and a caller's `h-10`
 * would both land in the attribute and the stylesheet — not the caller —
 * would decide which one wins.
 */
const SIZES = {
  md: { trigger: 'h-11 rounded-xl pl-3.5 pr-10 text-sm', chevron: 'right-3 h-4 w-4' },
  sm: { trigger: 'h-10 rounded-xl pl-3 pr-9 text-[13px]', chevron: 'right-3 h-4 w-4' },
  xs: { trigger: 'h-8 rounded-lg pl-2.5 pr-7 text-xs', chevron: 'right-2 h-3.5 w-3.5' },
};

/** Past this many options a list gets a search box. */
const SEARCH_THRESHOLD = 8;

/** Gap between the trigger and the list it opens. */
const GAP = 6;

/** The list's own height ceiling; it scrolls past this. */
const LIST_MAX = 280;

/** Flatten `options` or <option> children into one shape. */
function readOptions(options, children) {
  if (Array.isArray(options)) {
    return options.map((o) =>
      typeof o === 'string'
        ? { value: o, label: o, disabled: false }
        : { value: String(o.value ?? ''), label: o.label ?? String(o.value ?? ''), disabled: !!o.disabled }
    );
  }
  const out = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const { value, disabled, children: label } = child.props;
    // An <option> with no value posts its text, as a native one does.
    const v = value !== undefined ? String(value) : String(label ?? '');
    out.push({ value: v, label, disabled: !!disabled });
  });
  return out;
}

/** The text of a label, for searching — labels may be nodes, not strings. */
function labelText(label) {
  if (label == null) return '';
  if (typeof label === 'string' || typeof label === 'number') return String(label);
  if (Array.isArray(label)) return label.map(labelText).join('');
  if (isValidElement(label)) return labelText(label.props.children);
  return '';
}

export default function Select({
  value,
  onChange,
  options,
  children,
  placeholder,
  size = 'md',
  bare = false,
  searchable,
  leftIcon,
  invalid = false,
  disabled = false,
  className,
  wrapperClassName,
  chevronClassName,
  id,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}) {
  const reactId = useId();
  const listId = `${id || reactId}-list`;

  const items = useMemo(() => readOptions(options, children), [options, children]);
  const selected = items.find((o) => o.value === String(value ?? ''));
  const canSearch = searchable ?? items.length > SEARCH_THRESHOLD;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => setMounted(true), []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((o) => labelText(o.label).toLowerCase().includes(q));
  }, [items, query]);

  /** Where the list goes: below the trigger, or above it when below is short. */
  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, 180);
    const below = window.innerHeight - r.bottom;
    const up = below < LIST_MAX + 60 && r.top > below;
    // Kept on screen horizontally; a narrow trigger near the right edge would
    // otherwise open a list that runs off it.
    const left = Math.min(r.left, window.innerWidth - width - 8);
    setPos(
      up
        ? { left: Math.max(8, left), width, bottom: window.innerHeight - r.top + GAP }
        : { left: Math.max(8, left), width, top: r.bottom + GAP }
    );
  }, []);

  const close = useCallback((refocus) => {
    setOpen(false);
    setQuery('');
    setActive(-1);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openList = useCallback(() => {
    if (disabled) return;
    place();
    setOpen(true);
    // Start on the chosen row, so the list opens showing where you are.
    const i = items.findIndex((o) => o.value === String(value ?? ''));
    setActive(i >= 0 ? i : items.findIndex((o) => !o.disabled));
  }, [disabled, place, items, value]);

  const choose = useCallback(
    (opt) => {
      if (!opt || opt.disabled) return;
      if (opt.value !== String(value ?? '')) {
        onChange?.({ target: { value: opt.value, name }, currentTarget: { value: opt.value, name } });
      }
      close(true);
    },
    [value, onChange, name, close]
  );

  // Reposition while open — the page can scroll under a fixed list.
  useEffect(() => {
    if (!open) return undefined;
    const onMove = () => place();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, place]);

  // A press anywhere else closes it.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || popupRef.current?.contains(e.target)) return;
      close(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open, close]);

  // Focus goes into the list when it opens, so the keys below reach it.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => (canSearch ? searchRef.current : listRef.current)?.focus(), 0);
    return () => clearTimeout(t);
  }, [open, canSearch]);

  // Narrowing the list resets the highlight to its first choosable row.
  useEffect(() => {
    if (!open) return;
    setActive(visible.findIndex((o) => !o.disabled));
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the highlighted row in view as it moves.
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const move = (step) => {
    if (!visible.length) return;
    let i = active;
    for (let n = 0; n < visible.length; n += 1) {
      i = (i + step + visible.length) % visible.length;
      if (!visible[i].disabled) break;
    }
    setActive(i);
  };

  const onListKey = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        move(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActive(visible.findIndex((o) => !o.disabled));
        break;
      case 'End': {
        e.preventDefault();
        const rev = [...visible].reverse().findIndex((o) => !o.disabled);
        setActive(rev < 0 ? -1 : visible.length - 1 - rev);
        break;
      }
      case 'Enter':
        e.preventDefault();
        choose(visible[active]);
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        close(false);
        break;
      default:
    }
  };

  const onTriggerKey = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openList();
    }
  };

  const sizing = SIZES[size] || SIZES.md;

  const trigger = cn(
    'relative flex w-full min-w-0 items-center gap-2 text-left transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
    !bare && [
      sizing.trigger,
      'border bg-surface text-ink focus-visible:ring-2',
      invalid
        ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100'
        : open
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-ink/15 hover:border-ink/25 focus-visible:border-primary focus-visible:ring-primary/30',
    ].join(' '),
    'cursor-pointer',
    className
  );

  return (
    <div className={cn('relative', wrapperClassName)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={trigger}
      >
        {leftIcon}
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-ink/45')}>
          {selected ? selected.label : placeholder || ' '}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink/40 transition-transform duration-200',
            sizing.chevron,
            open && 'rotate-180',
            chevronClassName
          )}
        />
      </button>

      {name && <input type="hidden" name={name} value={value ?? ''} />}

      {open && mounted && pos &&
        createPortal(
          <div
            ref={popupRef}
            style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
            className="z-[100] overflow-hidden rounded-xl border border-ink/10 bg-surface shadow-[0_12px_32px_-8px_rgba(15,23,42,0.22),0_2px_6px_rgba(15,23,42,0.06)]"
          >
            {canSearch && (
              <div className="border-b border-ink/8 p-2">
                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 ring-primary/25 transition-shadow focus-within:ring-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-ink/35" aria-hidden="true" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onListKey}
                    placeholder="Search…"
                    aria-label="Search options"
                    aria-controls={listId}
                    aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
                    className="h-9 w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            )}

            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              onKeyDown={canSearch ? undefined : onListKey}
              aria-activedescendant={!canSearch && active >= 0 ? `${listId}-${active}` : undefined}
              style={{ maxHeight: LIST_MAX }}
              className="overflow-y-auto overscroll-contain p-1.5 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              {visible.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-ink/45">No matches</li>
              ) : (
                visible.map((opt, i) => {
                  const isSelected = opt.value === String(value ?? '');
                  const isActive = i === active;
                  return (
                    <li
                      key={`${opt.value}-${i}`}
                      id={`${listId}-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled || undefined}
                      onMouseEnter={() => !opt.disabled && setActive(i)}
                      // mousedown, not click: a click would blur the search box
                      // first and could close the list before it registered.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        choose(opt);
                      }}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        opt.disabled && 'cursor-not-allowed opacity-40',
                        isActive && !opt.disabled && 'bg-primary/[0.07]',
                        isSelected ? 'font-semibold text-primary' : 'text-ink/80'
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
