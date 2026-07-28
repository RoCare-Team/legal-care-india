/**
 * CitySkyline — the stand-in artwork for a city with no photograph yet.
 *
 * A tiered temple tower flanked by two smaller ones: the shape reads as an
 * Indian city at a glance, which a generic building icon does not. Repeating
 * one plain icon down a row looks like a missing image; drawn artwork looks
 * like a deliberate placeholder.
 *
 * Inline SVG rather than a file so it takes the brand colours directly and
 * costs no extra request.
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export default function CitySkyline({ className }) {
  return (
    <svg
      viewBox="0 0 64 46"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Flanking towers — lighter, so the centre reads as the subject. */}
      <g className="fill-primary/20">
        <polygon points="6,40 17,40 15.8,28 7.2,28" />
        <path d="M7.2 28a4.3 4.3 0 0 1 8.6 0z" />
        <rect x="11" y="20" width="1" height="4" rx="0.5" />

        <polygon points="47,40 58,40 56.8,28 48.2,28" />
        <path d="M48.2 28a4.3 4.3 0 0 1 8.6 0z" />
        <rect x="52" y="20" width="1" height="4" rx="0.5" />
      </g>

      {/* The gopuram: four tiers, each set back from the one below. */}
      <g className="fill-primary/45">
        <polygon points="19,40 45,40 43.4,32.5 20.6,32.5" />
        <polygon points="20.6,32.5 43.4,32.5 42,26 22,26" />
        <polygon points="22,26 42,26 40.6,20 23.4,20" />
        <polygon points="23.4,20 40.6,20 39.2,15 24.8,15" />
        {/* Crowning dome and finial. */}
        <path d="M24.8 15a7.2 7.2 0 0 1 14.4 0z" />
        <rect x="31.4" y="5.5" width="1.2" height="4.5" rx="0.6" />
        <circle cx="32" cy="11.5" r="2" />
      </g>

      {/* Gold: the finial tip and a few lit openings. */}
      <g className="fill-accent">
        <circle cx="32" cy="4.5" r="1.4" />
        <rect x="30.8" y="34.5" width="2.4" height="4" rx="1.2" />
        <rect x="25" y="28.5" width="1.8" height="1.8" rx="0.5" />
        <rect x="37.2" y="28.5" width="1.8" height="1.8" rx="0.5" />
        <rect x="10.6" y="32" width="1.8" height="1.8" rx="0.5" />
        <rect x="51.6" y="32" width="1.8" height="1.8" rx="0.5" />
      </g>

      {/* Plinth and ground, so nothing floats. */}
      <rect x="3" y="40" width="58" height="3" rx="0.8" className="fill-primary/30" />
      <rect x="0" y="44" width="64" height="1.6" rx="0.8" className="fill-primary/20" />
    </svg>
  );
}
