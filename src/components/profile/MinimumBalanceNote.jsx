import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { MIN_START_MINUTES, minimumStartBalance } from '@/constants/callRates';

/** True when the wallet does not cover the first MIN_START_MINUTES at `rate`. */
export function belowMinimum(walletBalance, rate) {
  const need = minimumStartBalance(rate);
  return need > 0 && (Number(walletBalance) || 0) < need;
}

/**
 * MinimumBalanceNote — shown in the chat, audio and video booking dialogs
 * when the wallet will not cover the first three minutes, before the start
 * button is pressed rather than after the server refuses it. Says exactly how
 * much is needed and how much more to add.
 *
 * @param {object} props
 * @param {number} props.walletBalance
 * @param {number} props.rate      ₹ per minute
 * @param {() => void} [props.onAddMoney]  closes the dialog on the way to the wallet
 */
export default function MinimumBalanceNote({ walletBalance, rate, onAddMoney }) {
  if (!belowMinimum(walletBalance, rate)) return null;
  const need = minimumStartBalance(rate);
  const short = Math.ceil(need - (Number(walletBalance) || 0));

  return (
    <div className="mt-3 rounded-xl border border-amber-300/70 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
      <p className="flex items-start gap-2">
        <Wallet className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Keep at least <strong>₹{need.toLocaleString('en-IN')}</strong> in your wallet to start — enough for the first{' '}
          {MIN_START_MINUTES} minutes. Add <strong>₹{short.toLocaleString('en-IN')}</strong> more.
        </span>
      </p>
      <Link
        href="/account?tab=wallet"
        onClick={onAddMoney}
        className="mt-2 inline-flex h-9 items-center rounded-lg bg-amber-600 px-3.5 text-[13px] font-semibold text-white hover:bg-amber-700"
      >
        Add money to wallet
      </Link>
    </div>
  );
}
