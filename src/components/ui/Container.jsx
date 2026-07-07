import { cn } from '@/utils/cn';

/**
 * Container — constrains content width and applies responsive horizontal padding.
 * The single source of truth for page gutters.
 *
 * @param {object} props
 * @param {import('react').ElementType} [props.as='div']
 * @param {string} [props.size='default']  'narrow' | 'default' | 'wide' | 'full'
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
const SIZES = {
  narrow: 'max-w-3xl',
  default: 'max-w-7xl',
  wide: 'max-w-[88rem]',
  full: 'max-w-none',
};

export default function Container({
  as: Tag = 'div',
  size = 'default',
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', SIZES[size], className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
