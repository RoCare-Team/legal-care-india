import { MessagesSquare, PhoneCall, Video, Building2, ShieldCheck } from 'lucide-react';
import { advocateRates, formatRate } from '@/constants/callRates';
import ProfileContactActions from './ProfileContactActions';

/**
 * ProfileConsultPanel — the four ways to consult, their prices, and the way in.
 *
 * It sits in the profile header rather than down the sidebar, because the
 * question it answers — what does this cost and how do I start — is the one a
 * visitor arrives with. In the sidebar the rates were below the fold on a
 * laptop, so the first thing anyone saw of a paid service was the About text.
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

  const tiles = [
    { label: 'Chat', icon: MessagesSquare, price: chatRate ? formatRate(chatRate) : '' },
    { label: 'Audio Call', icon: PhoneCall, price: audioRate ? formatRate(audioRate) : '' },
    { label: 'Video Call', icon: Video, price: videoRate ? formatRate(videoRate) : '' },
    { label: 'In-Person', icon: Building2, price: officeFee ? `₹${officeFee}` : '' },
  ].filter((t) => t.price);

  return (
    <div className="border-t border-ink/8 pt-5 lg:w-[420px] lg:shrink-0 lg:self-stretch lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
      {tiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tiles.map(({ label, icon: Icon, price }) => (
            <div
              key={label}
              className="rounded-xl bg-gradient-to-b from-primary-light/90 via-primary to-primary-dark px-2.5 py-3 text-center shadow-brand"
            >
              <Icon className="mx-auto h-4 w-4 text-accent" aria-hidden="true" />
              <p className="mt-1.5 text-[11.5px] font-semibold leading-tight text-white/75">{label}</p>
              <p className="mt-0.5 font-display text-[13px] font-bold text-white">{price}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3.5">
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

      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-ink/45">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
        100% Secure &amp; Private
      </p>
    </div>
  );
}
