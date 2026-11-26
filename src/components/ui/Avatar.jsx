'use client';

import Image from 'next/image';
import { cn } from '@/utils/cn';
import useImageStatus from '@/hooks/useImageStatus';

/**
 * Avatar — lawyer photo with a graceful initials fallback.
 * Used on profile headers, cards, dashboard and reviews.
 *
 * While the photo loads, a shimmer stands in for it; if it fails (a dead or
 * broken URL), the initials show instead of the browser's broken-image icon
 * and alt text.
 *
 * @param {object} props
 * @param {string} [props.src]        photo URL (empty → initials)
 * @param {string} props.name         used for alt + initials
 * @param {string} [props.size='md']  'sm'|'md'|'lg'|'xl'
 * @param {boolean} [props.ring=false]
 * @param {string} [props.className]
 */
const SIZES = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-lg',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-28 w-28 text-4xl',
};

const PX = { sm: 40, md: 56, lg: 80, xl: 112 };

export default function Avatar({ src, name = '', size = 'md', ring = false, className }) {
  const initials = name.replace(/^Adv\.?\s*/i, '').charAt(0).toUpperCase() || 'A';
  const { status, ref, onLoad, onError } = useImageStatus(src);

  const showPhoto = Boolean(src) && status !== 'error';

  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/10 font-display font-semibold text-primary',
        SIZES[size],
        ring && 'ring-4 ring-white',
        className
      )}
    >
      {showPhoto ? (
        <>
          {status === 'loading' && (
            <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-primary/15" />
          )}
          <Image
            src={src}
            alt={name}
            width={PX[size]}
            height={PX[size]}
            ref={ref}
            onLoad={onLoad}
            onError={onError}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              status === 'loaded' ? 'opacity-100' : 'opacity-0'
            )}
          />
        </>
      ) : (
        initials
      )}
    </span>
  );
}
