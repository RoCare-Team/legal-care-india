'use client';

import { Clock, Wallet } from 'lucide-react';
import { slotsFor } from '@/constants/consultationSlots';

/**
 * How long to book, and what that costs.
 *
 * Shared by the chat, audio and video modals so the three cannot drift into
 * quoting different prices for the same block of the same lawyer's time.
 *
 * A slot is a ceiling, not a ticket, and the note under it says so — a client
 * who books thirty minutes and finishes in ten pays for ten. That sentence is
 * the whole difference between this and buying a package, and leaving it out
 * would make the prices look worse than they are.
 *
 * A block the wallet cannot cover is shown but not selectable, with the
 * shortfall named. Hiding it would leave a client wondering why the lawyer's
 * card advertised a 30-minute price they cannot find.
 *
 * @param {object} props
 * @param {object} props.advocate   needs `slotPrices`; defaults fill the rest
 * @param {number} props.value      the chosen slot's minutes
 * @param {(minutes:number)=>void} props.onChange
 * @param {number} props.walletBalance
 */
export default function SlotPicker({
  advocate, value, onChange, walletBalance = 0, channel,
}) {
  // Priced per channel: a lawyer may charge differently for typing than for
  // being on camera, so the picker has to be told which one it is showing.
  const slots = slotsFor(advocate, channel);
  const balance = Number(walletBalance) || 0;

  return (
    <div className="mt-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
        How long do you want to book?
      </p>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const affordable = balance >= slot.price;
          const selected = value === slot.minutes;

          return (
            <button
              key={slot.minutes}
              type="button"
              disabled={!affordable}
              aria-pressed={selected}
              onClick={() => onChange(slot.minutes)}
              className={`rounded-xl border px-2 py-3 text-center transition-colors ${
                selected
                  ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/25'
                  : 'border-ink/12 hover:border-primary/40'
              } ${affordable ? '' : 'cursor-not-allowed opacity-45'}`}
            >
              <span className="block text-[12.5px] font-semibold text-ink/60">
                {slot.label}
              </span>
              <span className="mt-0.5 block font-display text-lg font-bold text-ink">
                ₹{slot.price.toLocaleString('en-IN')}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-ink/50">
        This is the most it can cost. The session bills only the minutes it
        actually runs — end it whenever you like and the rest is never charged.
      </p>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-sm text-ink/60">
          <Wallet className="h-4 w-4 text-primary" aria-hidden="true" /> Wallet balance
        </span>
        <span className="text-sm font-semibold text-ink">
          ₹{balance.toLocaleString('en-IN')}
        </span>
      </div>

      {slots.every((s) => balance < s.price) && (
        <p className="mt-2 text-[12.5px] font-medium text-amber-700">
          Add ₹{Math.max(1, slots[0].price - balance).toLocaleString('en-IN')} to your
          wallet to book the shortest consultation.
        </p>
      )}
    </div>
  );
}
