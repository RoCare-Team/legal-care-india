import Image from 'next/image';

/**
 * SmartImage — `next/image` for every source that can actually use it.
 *
 * The images on this site come from two different worlds. Blog covers and city
 * pictures are ordinary https URLs, and those should go through the optimizer:
 * AVIF/WebP, a proper srcset, and lazy loading below the fold.
 *
 * Uploads are the other world. This app stores them inline, so an advocate's
 * photo arrives as `data:image/jpeg;base64,…` and an upload preview as a
 * `blob:` URL. `next/image` cannot handle either — there is no host to fetch
 * from and nothing to cache, and handing it one is an error rather than a
 * slower image. So those fall through to a plain `<img>`, which is the correct
 * tag for them: the bytes are already in the document, and there is no
 * optimisation left to do.
 *
 * Deciding this per-source in one place is why the rest of the codebase can
 * stop thinking about it — and why the `no-img-element` lint rule is disabled
 * here only, where the exception is deliberate, instead of at seven call sites
 * where it just looked like noise.
 *
 * Renders with `fill`, so the parent must be positioned (`relative`) and give
 * the box its size.
 *
 * @param {object} props
 * @param {string} props.src
 * @param {string} props.alt
 * @param {string} [props.className]
 * @param {string} [props.sizes]      viewport hint for the srcset
 * @param {boolean} [props.priority]  preload — only for above-the-fold images
 */
export default function SmartImage({
  src,
  alt = '',
  className,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
}) {
  if (!src) return null;

  // Everything the optimizer can fetch: a remote http(s) URL, or a path served
  // from /public. Anything else is inline bytes.
  const optimizable = /^https?:\/\//i.test(src) || src.startsWith('/');

  if (!optimizable) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
    />
  );
}
