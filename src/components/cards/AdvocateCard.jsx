import {
  MapPin,
  BadgeCheck,
  Languages,
  IndianRupee,
  Phone,
  Mail,
  MessageCircle,
  Briefcase,
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import Rating from "@/components/shared/Rating";
import { formatExperience } from "@/utils/formatters";

/**
 * AdvocateCard — directory listing card for a single advocate.
 * Presentational: receives a single `advocate` record from src/data.
 *
 * @param {object} props
 * @param {import('@/data/advocates').ADVOCATES[number]} props.advocate
 */
export default function AdvocateCard({ advocate }) {
  const {
    slug,
    name,
    photo,
    city,
    state,
    experience,
    rating,
    reviews,
    verified,
    specializations = [],
    languages = [],
    consultationFee,
    contact,
  } = advocate;

  return (
    <Card
      hoverable
      padding="none"
      className="group flex h-full flex-col overflow-hidden"
    >
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Header: photo + identity + quick contact */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar src={photo} name={name} size="md" className="rounded-xl" />
            {verified && (
              <span
                className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-surface shadow-sm"
                aria-label="Verified advocate"
              >
                <BadgeCheck className="h-4 w-4 text-primary" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight text-ink">
              {name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/60">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {city}, {state}
              </span>
            </p>
            <Rating value={rating} reviews={reviews} size="sm" className="mt-1" />
          </div>
        </div>

        {/* Specializations */}
        {specializations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specializations.slice(0, 3).map((s) => (
              <Badge key={s} variant="primary" size="sm">
                {s}
              </Badge>
            ))}
          </div>
        )}

        {/* Compact meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/70">
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
            <span className="font-medium text-ink/80">
              {formatExperience(experience)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
            <span className="truncate">{languages.join(", ")}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <IndianRupee className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
            <span className="font-medium text-ink/80">₹{consultationFee}</span>
            <span className="text-ink/50">consult</span>
          </span>
        </div>

        {/* Footer: quick contact + CTA */}
        <div className="mt-4 flex items-center gap-2 border-t border-ink/8 pt-4">
          <a
            href={`tel:${contact?.phone || ""}`}
            aria-label={`Call ${name}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-white py-2.5 text-sm font-medium text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
          <a
            href={`https://wa.me/${contact?.whatsapp || ""}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${name}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-white py-2.5 text-sm font-medium text-green-600 transition-colors hover:border-green-300 hover:bg-green-50"
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </a>
          <a
            href={`mailto:${contact?.email || ""}`}
            aria-label={`Email ${name}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-white py-2.5 text-sm font-medium text-red-500 transition-colors hover:border-red-300 hover:bg-red-50"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>

          <Button
            href={`/advocates/${slug}`}
            size="md"
            className="flex-[1.6] whitespace-nowrap"
          >
            View Profile
          </Button>
        </div>
      </div>
    </Card>
  );
}
