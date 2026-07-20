'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * MetricTrendCard — one dashboard card: a headline total, a period-over-period
 * growth badge, and a single-series area+line chart with a crosshair tooltip.
 *
 * @param {object} props
 * @param {string} props.label   e.g. "Consultations"
 * @param {string} props.color   line/fill hue (hex)
 * @param {boolean} [props.money] format values as ₹
 * @param {Array<{date:string,value:number}>} props.points
 * @param {number} props.total
 * @param {number} props.growth  percentage vs the previous period
 */
const W = 360;
const H = 120;
const PAD = { top: 10, right: 8, bottom: 8, left: 8 };

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Smooth cubic path through every point, using Fritsch–Carlson monotone
 * tangents. A plain Catmull-Rom curve overshoots around spikes, which on a
 * counts series draws the line below zero between two quiet days — monotone
 * interpolation stays inside the data, so it never invents a dip.
 */
function smoothPath(pts) {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0].cx},${pts[0].cy}`;
  if (n === 2) return `M${pts[0].cx},${pts[0].cy} L${pts[1].cx},${pts[1].cy}`;

  // Secant slope of each segment.
  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = pts[i + 1].cx - pts[i].cx;
    slope[i] = dx[i] === 0 ? 0 : (pts[i + 1].cy - pts[i].cy) / dx[i];
  }

  // Tangent at each point: average of neighbouring slopes, forced to 0 at every
  // local extreme, then clamped to three times the smaller neighbour so the
  // curve cannot overshoot.
  const m = [slope[0]];
  for (let i = 1; i < n - 1; i += 1) {
    if (slope[i - 1] * slope[i] <= 0) {
      m[i] = 0;
    } else {
      const avg = (slope[i - 1] + slope[i]) / 2;
      const limit = 3 * Math.min(Math.abs(slope[i - 1]), Math.abs(slope[i]));
      m[i] = Math.sign(avg) * Math.min(Math.abs(avg), limit);
    }
  }
  m[n - 1] = slope[n - 2];

  let d = `M${pts[0].cx},${pts[0].cy}`;
  for (let i = 0; i < n - 1; i += 1) {
    const t = dx[i] / 3;
    const c1x = pts[i].cx + t;
    const c1y = pts[i].cy + m[i] * t;
    const c2x = pts[i + 1].cx - t;
    const c2y = pts[i + 1].cy - m[i + 1] * t;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${pts[i + 1].cx},${pts[i + 1].cy}`;
  }
  return d;
}

export default function MetricTrendCard({ label, color, money = false, points = [], total = 0, growth = 0 }) {
  const [hover, setHover] = useState(null);
  const [drawn, setDrawn] = useState(false);
  const lineRef = useRef(null);
  const gradId = useId();

  const geo = useMemo(() => {
    const max = Math.max(1, ...points.map((p) => p.value));
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const n = points.length;
    const x = (i) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = (v) => PAD.top + innerH - (v / max) * innerH;
    const pts = points.map((p, i) => ({ i, cx: x(i), cy: y(p.value), ...p }));
    const baseline = PAD.top + innerH;
    const line = smoothPath(pts);
    // Same curve, closed down to the baseline at both ends for the fill.
    const area = pts.length
      ? `${line} L${pts[pts.length - 1].cx},${baseline} L${pts[0].cx},${baseline} Z`
      : '';
    return { pts, line, area, baseline };
  }, [points]);

  // Draw the line in on mount: animate stroke-dashoffset from the full path
  // length down to 0, so the graph "grows" left→right like a live ticker.
  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setDrawn(true); return; }

    let len = 0;
    try { len = el.getTotalLength(); } catch { len = 0; }
    if (!len) { setDrawn(true); return; }

    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    el.getBoundingClientRect(); // force reflow so the offset starts applied
    const id = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 2.6s cubic-bezier(0.33, 1, 0.68, 1)';
      el.style.strokeDashoffset = '0';
      setDrawn(true);
    });
    return () => cancelAnimationFrame(id);
  }, [geo.line]);

  const fmt = (v) => (money ? `₹${Number(v).toLocaleString('en-IN')}` : String(v));
  const up = growth >= 0;

  function onMove(e) {
    if (!geo.pts.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    for (const p of geo.pts) {
      const dist = Math.abs(p.cx - px);
      if (dist < bestDist) { bestDist = dist; best = p.i; }
    }
    setHover(best);
  }

  const active = hover != null ? geo.pts[hover] : null;

  return (
    <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">{fmt(total)}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-emerald-500/12 text-emerald-600' : 'bg-rose-500/12 text-rose-600'}`}>
          {up ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
          {up ? '+' : ''}{growth}%
        </span>
      </div>
      <p className="mt-0.5 text-xs text-ink/40">last {points.length} days · vs previous</p>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none select-none"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`${label} over the last ${points.length} days`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          <line x1={PAD.left} y1={geo.baseline} x2={W - PAD.right} y2={geo.baseline} stroke="currentColor" className="text-ink/10" strokeWidth="1" />
          <path
            d={geo.area}
            fill={`url(#${gradId})`}
            style={{ opacity: drawn ? 1 : 0, transition: 'opacity 1.6s ease-out 0.6s' }}
          />
          <path
            ref={lineRef}
            d={geo.line}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {active && (
            <g>
              <line x1={active.cx} y1={PAD.top} x2={active.cx} y2={geo.baseline} stroke={color} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={active.cx} cy={active.cy} r="4.5" fill={color} stroke="#FFFFFF" strokeWidth="2" />
            </g>
          )}
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-ink/10 bg-muted px-2.5 py-1.5 text-center shadow-card"
            style={{ left: `${(active.cx / W) * 100}%`, top: `${(active.cy / H) * 100}%`, marginTop: '-8px' }}
          >
            <p className="whitespace-nowrap text-[11px] text-ink/50">{fmtDate(active.date)}</p>
            <p className="whitespace-nowrap text-sm font-bold text-ink">{fmt(active.value)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
