import { cn } from '@/utils/cn';
import Container from './Container';

/**
 * Section — a full-width page band with consistent vertical rhythm.
 * Optionally wraps children in a Container.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {string} [props.spacing='default']  'sm' | 'default' | 'lg'
 * @param {boolean} [props.contained=true]    wrap children in a Container
 * @param {string} [props.containerSize]       passed through to Container
 * @param {string} [props.className]           applied to the outer <section>
 * @param {string} [props.innerClassName]      applied to the Container
 * @param {import('react').ReactNode} props.children
 */
/**
 * Vertical rhythm — the single lever for how tall every page on the site is.
 *
 * Two stacked sections each contribute their own padding, so the visible gap
 * between them is roughly double these numbers. Tightened again from
 * py-10/14/20: at those values a visitor scrolled past more empty space than
 * content, and a band that is generously padded on a 27-inch monitor is simply
 * a long scroll on a laptop.
 */
const SPACING = {
  sm: 'py-6 sm:py-8',
  default: 'py-7 sm:py-10',
  lg: 'py-9 sm:py-14',
};

export default function Section({
  id,
  spacing = 'default',
  contained = true,
  containerSize = 'default',
  className,
  innerClassName,
  children,
  ...props
}) {
  const content = contained ? (
    <Container size={containerSize} className={innerClassName}>
      {children}
    </Container>
  ) : (
    children
  );

  return (
    <section id={id} className={cn(SPACING[spacing], className)} {...props}>
      {content}
    </section>
  );
}
