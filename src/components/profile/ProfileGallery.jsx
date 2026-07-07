import { ImageIcon } from 'lucide-react';
import ProfileSection from './ProfileSection';

/**
 * ProfileGallery — office photo grid. Uses labelled gradient placeholders
 * until real uploads are wired up.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileGallery({ advocate }) {
  // Guard against null/empty holes in saved gallery data.
  const gallery = (advocate.gallery || []).filter(Boolean);
  if (gallery.length === 0) return null;

  return (
    <ProfileSection id="gallery" title="Office Gallery" icon={ImageIcon}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {gallery.map((img, i) => (
          <figure
            key={img.id || i}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-ink/8"
          >
            {img.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.url}
                alt={img.label || `Office photo ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div
                className={`h-full w-full bg-gradient-to-br ${
                  ['from-primary/15 to-secondary/15', 'from-secondary/15 to-accent/15', 'from-accent/15 to-primary/15'][i % 3]
                }`}
                aria-hidden="true"
              />
            )}
            {img.label && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-xs font-medium text-white">
                {img.label}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </ProfileSection>
  );
}
