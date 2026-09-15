'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, ArrowRight, ChevronDown } from 'lucide-react';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/**
 * Earnings — the chosen period's total against the one before it, the last
 * seven days as bars, and the wallet balance.
 *
 * @param {object} props
 * @param {Record<string, {label:string, compareLabel:string, earned:number, previousEarned:number, sessions:number, minutes:number}>} props.periods
 * @param {Array<{key:string, weekday:string, date:string, amount:number, isToday:boolean}>} props.week
 * @param {number} props.walletBalance
 * @param {boolean} [props.showLink=true]  the "View Earnings" button — off on the earnings page itself
 */
export default function EarningsCard({ periods, week, walletBalance, showLink = true }) {
  const [key, setKey] = useState('today');
  const p = periods[key];
  const change = p.previousEarned ? Math.round(((p.earned - p.previousEarned) / p.previousEarned) * 100) : null;
  const max = Math.max(...week.map((d) => d.amount), 0);

  return (
    <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Earnings
          <span className="block font-sans text-[11px] font-normal text-ink/45">After JusticeLand commission</span>
        </h2>
        <label className="relative">
          <span className="sr-only">Period</span>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="h-9 cursor-pointer appearance-none rounded-xl border border-ink/12 bg-surface pl-3 pr-8 text-sm font-medium text-ink/80 hover:border-ink/25 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {Object.entries(periods).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" aria-hidden="true" />
        </label>
      </div>

      <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">{money(p.earned)}</p>
      <p className="mt-1 flex items-center gap-1 text-sm">
        {change === null ? (
          <span className="text-ink/45">{p.noCompare}</span>
        ) : (
          <>
            {change >= 0 ? (
              <ArrowUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-500" aria-hidden="true" />
            )}
            <span className={`font-semibold ${change >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {Math.abs(change)}%
            </span>
            <span className="text-ink/55">from {p.compareLabel}</span>
          </>
        )}
      </p>

      {/* Last 7 days. One series, so no legend; today is the solid bar. */}
      <figure className="mt-5">
        <figcaption className="mb-2 text-xs font-medium text-ink/45">Last 7 days</figcaption>
        <div className="flex h-32 items-end gap-2 border-b border-ink/10">
          {week.map((d, i) => {
            const pct = max ? (d.amount / max) * 100 : 0;
            // Edge bars anchor their tooltip inward so it never spills off a phone screen.
            const tipPos = i < 2 ? 'left-0' : i > 4 ? 'right-0' : 'left-1/2 -translate-x-1/2';
            return (
              <div key={d.key} className="group relative flex h-full flex-1 items-end justify-center">
                <div
                  className={`w-full max-w-9 rounded-t-[4px] transition-colors ${
                    d.amount === 0
                      ? 'bg-ink/10'
                      : d.isToday
                        ? 'bg-accent'
                        : 'bg-accent/45 group-hover:bg-accent/70'
                  }`}
                  style={{ height: d.amount ? `max(${pct}%, 6px)` : '2px' }}
                  aria-hidden="true"
                />
                <span
                  role="tooltip"
                  className={`pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100 ${tipPos}`}
                >
                  {d.weekday}, {d.date} · <span className="font-semibold">{money(d.amount)}</span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 flex gap-2" aria-hidden="true">
          {week.map((d) => (
            <span
              key={d.key}
              className={`flex-1 text-center text-xs ${d.isToday ? 'font-semibold text-ink' : 'text-ink/50'}`}
            >
              {d.weekday}
            </span>
          ))}
        </div>
        <table className="sr-only">
          <caption>Earnings over the last 7 days</caption>
          <tbody>
            {week.map((d) => (
              <tr key={d.key}>
                <th scope="row">{d.weekday}, {d.date}</th>
                <td>{money(d.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>

      <dl className="mt-5 divide-y divide-ink/8 rounded-xl border border-ink/8 text-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-ink/60">Completed Sessions</dt>
          <dd className="font-semibold text-ink">{p.sessions}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-ink/60">Minutes Talked</dt>
          <dd className="font-semibold text-ink">{p.minutes}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-ink/60">Withdrawable Balance</dt>
          <dd className="font-semibold text-ink">{money(walletBalance)}</dd>
        </div>
      </dl>

      {showLink && (
        <Link
          href="/dashboard/earnings"
          className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-dark text-sm font-semibold text-white shadow-brand transition-colors hover:bg-primary"
        >
          View Earnings
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
