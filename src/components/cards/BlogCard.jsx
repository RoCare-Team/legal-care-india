import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge, Card } from '@/components/ui';

/**
 * BlogCard — a single article entry in the blogs grid.
 *
 * @param {object} props
 * @param {import('@/data/blogs').BLOGS[number]} props.post
 */
export default function BlogCard({ post }) {
  const { slug, title, excerpt, category, readMinutes, date } = post;

  return (
    <Card as={Link} href={`/blogs/${slug}`} hoverable padding="none" className="group flex h-full flex-col overflow-hidden">
      <div className="relative h-40 bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/15">
        <Badge variant="primary" className="absolute left-4 top-4">{category}</Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-ink/45">
          <span>{date}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {readMinutes} min read
          </span>
        </div>
        <h3 className="mt-2 font-semibold text-ink group-hover:text-primary">{title}</h3>
        <p className="mt-2 flex-1 text-sm text-ink/60">{excerpt}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          Read article
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Card>
  );
}
