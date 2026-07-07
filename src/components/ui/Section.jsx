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
const SPACING = {
  sm: 'py-10 sm:py-12',
  default: 'py-14 sm:py-20',
  lg: 'py-20 sm:py-28',
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
