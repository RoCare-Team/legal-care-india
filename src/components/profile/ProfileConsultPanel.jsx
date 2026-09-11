import { MessagesSquare, PhoneCall, Video, Building2, ShieldCheck } from 'lucide-react';
import { advocateRates } from '@/constants/callRates';
import ProfileContactActions from './ProfileContactActions';

/**
 * ProfileConsultPanel — the four ways to consult, their prices, and the way in.
 *
 * It sits in the profile header rather than down the sidebar, because the
 * question it answers — what does this cost and how do I start — is the one a
 * visitor arrives with. In the sidebar the rates were below the fold on a
 * laptop, so the first thing anyone saw of a paid service was the About text.
 *
 * A card of its own: everything else in the header is read, this is the part
 * that is pressed, and a border and a lift say so before any label does.
 *
 * The four tiles are read, not pressed: they are the price list. Pressing
 * happens underneath, in the actions the site already had.
 *
 * A channel with no rate is not shown. Every lawyer sets their own, falling
 * back to the platform's, so in practice the three live ones are always there;
 * the in-person fee is the one that is genuinely optional, because not every
 * lawyer takes office appointments.
 *
 * @param {object} props
 * @param {object} props.advocate  full profile
 */
export default function ProfileConsultPanel({ advocate }) {
  const { contact = {}, name } = advocate;
  const advocateId = advocate._id || advocate.id || '';
  const { chat: chatRate, audio: audioRate, video: videoRate } = advocateRates(advocate);
  const officeFee = Number(advocate.consultationFee) || 0;

  const waText = encodeURIComponent(
    `Hi ${name}, I found your profile on Justiceland and would like a consultation.`
  );

  // Amount and unit kept apart so the unit can be set smaller than the figure.
  const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
  const tiles = [
    { label: 'Chat', icon: MessagesSquare, price: chatRate ? rupees(chatRate) : '', unit: '/min' },
    { label: 'Audio Call', icon: PhoneCall, price: audioRate ? rupees(audioRate) : '', unit: '/min' },
    { label: 'Video Call', icon: Video, price: videoRate ? rupees(videoRate) : '', unit: '/min' },
    { label: 'In-Person', icon: Building2, price: officeFee ? rupees(officeFee) : '', unit: '/visit' },
  ].filter((t) => t.price);

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-[0_1px_2px_rgba(30,58,95,0.05),0_18px_40px_-24px_rgba(30,58,95,0.35)] sm:p-5">
      {tiles.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[12px] font-bold uppercase tracking-wide text-ink/50">Consultation fees</p>
            {(chatRate || audioRate || videoRate) > 0 && (
              <p className="text-[11.5px] text-ink/45">Pay only for minutes used</p>
            )}
          </div>

          {/* Two to a row, each tile a small horizontal card: the icon on its
              own gold-edged square, then what it is and what it costs. Four
              across squeezed "Audio Call ₹150/min" into 90px, where the figure
              had to shrink to fit and the icon floated above it unanchored. */}
          <div className={`grid gap-2.5 ${tiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {tiles.map(({ label, icon: Icon, price, unit }) => (
              <div
                key={label}
                className="relative flex items-center gap-2.5 overflow-hidden rounded-xl [&:last-child:nth-child(odd)]:col-span-2 sm:gap-3 bg-gradient-to-br from-primary-light via-primary to-primary-dark px-2.5 py-3 shadow-brand sm:px-3"
              >
                {/* A soft gold glow in the corner, so four navy blocks read as
                    cards rather than as flat buttons. */}
                <span
                  className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-accent/15 blur-xl"
                  aria-hidden="true"
                />
                <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.08] text-accent ring-1 ring-accent/30 sm:h-12 sm:w-12">
                  <Icon className="h-6 w-6 sm:h-[26px] sm:w-[26px]" strokeWidth={1.9} aria-hidden="true" />
                </span>
                <div className="relative min-w-0">
                  <p className="truncate text-[10.5px] font-semibold uppercase tracking-wide sm:text-[11.5px] text-white/60">
                    {label}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap font-display text-[15px] font-bold sm:text-[17px] leading-tight text-white">
                    {price}
                    <span className="ml-0.5 font-sans text-[10.5px] sm:text-[11.5px] font-medium text-white/60">{unit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={tiles.length > 0 ? 'mt-4' : ''}>
        <ProfileContactActions
          slotPrices={advocate.slotPrices}
          contact={contact}
          name={name}
          waText={waText}
          advocateId={advocateId}
          chatRate={chatRate}
          audioRate={audioRate}
        />
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-ink/[0.06] pt-3 text-[11.5px] text-ink/50">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
        100% Secure &amp; Private · Verified lawyers only
      </p>
    </div>
  );
}
