import { cn } from '@/utils/cn';

/**
 * Card — surface primitive with optional hover elevation.
 * Composed by AdvocateCard, CategoryCard, TestimonialCard, etc.
 *
 * @param {object} props
 * @param {import('react').ElementType} [props.as='div']
 * @param {boolean} [props.hoverable=false]
 * @param {string} [props.padding='md']  'none'|'sm'|'md'|'lg'
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export default function Card({
  as: Tag = 'div',
  hoverable = false,
  padding = 'md',
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-ink/8 bg-surface shadow-card',
        hoverable &&
          'transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-card-hover',
        PADDING[padding],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
