import Image from 'next/image';
import { cn } from '@/utils/cn';

/**
 * Avatar — advocate photo with a graceful initials fallback.
 * Used on profile headers, cards, dashboard and reviews.
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
  const initials = name.replace(/^Adv\.?\s*/, '').charAt(0).toUpperCase() || 'A';

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/10 font-display font-semibold text-primary',
        SIZES[size],
        ring && 'ring-4 ring-white',
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={PX[size]}
          height={PX[size]}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
