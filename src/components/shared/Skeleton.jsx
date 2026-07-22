import { cn } from '@/utils/cn';

/**
 * Skeleton — a placeholder block with a light sweep across it.
 *
 * Used by the route-level loading screens (app/**\/loading.js) that Next.js
 * shows the instant a navigation starts, so a click never leaves the visitor
 * staring at the old page wondering whether it registered.
 *
 * The sweep is a child element rather than a background animation: a moving
 * gradient on a large block repaints the whole box every frame, a translated
 * overlay is composited on the GPU.
 *
 * @param {object} props
 * @param {string} [props.className]  size/shape utilities (w-, h-, rounded-)
 */
export default function Skeleton({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative block overflow-hidden rounded-lg bg-ink/[0.07]',
        className
      )}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </span>
  );
}
