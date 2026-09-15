import Image from 'next/image';

/**
 * The lawyer's photo, or their initial, sized for the portal chrome. Unlike
 * the shared Avatar it takes its colours from the caller, so the initial stays
 * legible on the navy sidebar and hero as well as on white.
 *
 * @param {object} props
 * @param {string} [props.src]
 * @param {string} props.name
 * @param {number} [props.size=40]  px
 * @param {string} [props.className]  colours, border, radius
 */
export default function PortalAvatar({ src, name = '', size = 40, className = 'rounded-full bg-primary/10 text-primary' }) {
  const initial = String(name).replace(/^Adv\.?\s*/i, '').trim().charAt(0).toUpperCase() || 'A';
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden font-display font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {src ? (
        <Image src={src} alt={name} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
