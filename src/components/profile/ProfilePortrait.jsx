'use client';

import { useState } from 'react';
import Image from 'next/image';

const FRAME =
  'overflow-hidden rounded-2xl shadow-[0_12px_28px_-14px_rgba(30,58,95,0.45)] ring-4 ring-white';
const BLANK = 'h-[112px] w-[92px] sm:h-[160px] sm:w-[132px]';

/**
 * The profile header's portrait.
 *
 * The frame takes the photo's own shape: a fixed height, and the width the
 * photo needs at that height. Lawyers upload everything from head shots to
 * campaign posters; a fixed square either cut the edges off anything that
 * wasn't square or left empty strips down both sides. Only a very wide photo
 * is held to a maximum width and trimmed at its sides.
 *
 * A shimmer holds the space while the photo loads; with no photo, or one whose
 * URL is dead, the initial shows instead of the browser's broken image and alt
 * text.
 *
 * @param {object} props
 * @param {string} [props.photo]
 * @param {string} props.name
 * @param {string} props.initial
 */
export default function ProfilePortrait({ photo, name, initial }) {
  const [state, setState] = useState({ photo, status: 'loading' });
  const status = state.photo === photo ? state.status : 'loading';
  if (state.photo !== photo) setState({ photo, status: 'loading' });

  if (!photo || status === 'error') {
    return (
      <div
        className={`${FRAME} ${BLANK} grid place-items-center bg-gradient-to-br from-primary/[0.12] to-primary/[0.04] font-display text-4xl font-semibold text-primary/70 sm:text-5xl`}
      >
        {initial}
      </div>
    );
  }

  return (
    <div className={`${FRAME} relative bg-primary/[0.06]`}>
      {status === 'loading' && (
        <div aria-hidden="true" className={`${BLANK} animate-pulse bg-primary/10`} />
      )}
      <Image
        src={photo}
        alt={name}
        width={264}
        height={264}
        priority
        onLoad={() => setState({ photo, status: 'loaded' })}
        onError={() => setState({ photo, status: 'error' })}
        className={
          status === 'loaded'
            ? 'block h-[112px] w-auto min-w-[64px] max-w-[150px] object-cover sm:h-[160px] sm:min-w-[88px] sm:max-w-[220px]'
            : // Off-screen until it arrives, so the shimmer sets the size.
              'absolute h-px w-px opacity-0'
        }
      />
    </div>
  );
}
