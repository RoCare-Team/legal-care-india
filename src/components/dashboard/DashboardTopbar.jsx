import { BadgeCheck, ExternalLink } from 'lucide-react';
import { Avatar, Badge, Button } from '@/components/ui';

/**
 * DashboardTopbar — identity banner at the top of the dashboard shell.
 *
 * @param {object} props
 * @param {object} props.advocate  demo advocate profile
 */
export default function DashboardTopbar({ advocate }) {
  if (!advocate) return null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <Avatar src={advocate.photo} name={advocate.name} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-ink">{advocate.name}</h1>
            {advocate.verified && (
              <Badge variant="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                Verified
              </Badge>
            )}
          </div>
          <p className="mt-0.5 break-words text-sm text-ink/55">
            {advocate.city}, {advocate.state} · {advocate.contact?.email}
          </p>
        </div>
      </div>
      <Button
        href={`/advocates/${advocate.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        size="sm"
        rightIcon={<ExternalLink className="h-4 w-4" />}
      >
        View Public Profile
      </Button>
    </div>
  );
}
