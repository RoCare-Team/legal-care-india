'use client';

import CardContactActions from '@/components/cards/CardContactActions';

/**
 * ProfileMobileBar — fixed bottom action bar (mobile only) on the public
 * profile: the same Call / Chat / Video buttons as the listing cards, each
 * opening that channel's paid consultation. No direct phone, WhatsApp or email.
 *
 * @param {object} props
 * @param {object} props.advocate  { _id, name, slotPrices, rates: { chat, audio, video } }
 */
export default function ProfileMobileBar({ advocate }) {
  const { name, _id: advocateId, rates = {} } = advocate;
  const { chat: chatRate, audio: audioRate, video: videoRate } = rates;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-surface/95 p-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <CardContactActions
          variant="mobile"
          name={name}
          advocateId={advocateId}
          slotPrices={advocate.slotPrices}
          chatRate={chatRate}
          videoRate={videoRate}
          audioRate={audioRate}
        />
      </div>
    </div>
  );
}
