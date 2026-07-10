import {
  MapPin,
  BadgeCheck,
  Languages,
  Phone,
  Mail,
  MessageCircle,
  Briefcase,
  ArrowRight,
  Scale,
  Gavel,
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import Rating from "@/components/shared/Rating";
import { formatExperience } from "@/utils/formatters";
import { advocateProfilePath } from "@/utils/advocateUrl";

/**
 * AdvocateCard — premium directory listing card for a single advocate.
 * Presentational: receives a single `advocate` record.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function AdvocateCard({ advocate }) {
  const {
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
      className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
    >
      {/* Legal-themed header banner */}
      <div className="relative h-16 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark">
        {/* Faded courtroom motifs */}
        <Scale
          className="pointer-events-none absolute -left-3 -top-4 h-24 w-24 rotate-12 text-white/[0.07]"
          aria-hidden="true"
        />
        <Gavel
          className="pointer-events-none absolute bottom-1 left-24 h-11 w-11 -rotate-12 text-accent/25"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.08]" />
        <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          ₹{consultationFee}
          <span className="font-normal text-white/70"> / consult</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
        {/* Identity — transparent avatar on the card */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar
              src={photo}
              name={name}
              size="lg"
              className="rounded-2xl !bg-transparent ring-1 ring-ink/10"
            />
            {verified && (
              <span
                className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-surface shadow"
                aria-label="Verified advocate"
              >
                <BadgeCheck className="h-4 w-4 text-primary" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-semibold leading-tight text-ink">
              {name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/60">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
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

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/70">
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
            <span className="font-medium text-ink/80">
              {formatExperience(experience)}
            </span>
          </span>
          {languages.length > 0 && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Languages className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
              <span className="truncate">{languages.join(", ")}</span>
            </span>
          )}
        </div>

        {/* Footer: quick contact + primary CTA */}
        <div className="mt-auto pt-4">
          <div className="grid grid-cols-3 gap-2 border-t border-ink/8 pt-4">
            <ContactAction
              href={`tel:${contact?.phone || ""}`}
              label={`Call ${name}`}
              icon={Phone}
              text="Call"
              className="text-blue-600 hover:border-blue-300 hover:bg-blue-50"
            />
            <ContactAction
              href={`https://wa.me/${contact?.whatsapp || ""}`}
              external
              label={`WhatsApp ${name}`}
              icon={MessageCircle}
              text="Chat"
              className="text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
            />
            <ContactAction
              href={`mailto:${contact?.email || ""}`}
              label={`Email ${name}`}
              icon={Mail}
              text="Email"
              className="text-red-500 hover:border-red-300 hover:bg-red-50"
            />
          </div>

          <Button
            href={`/advocates/${advocateProfilePath(advocate)}`}
            fullWidth
            className="mt-2 group/btn"
            rightIcon={
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            }
          >
            View Profile
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** A single quick-contact action button. */
function ContactAction({ href, external, label, icon: Icon, text, className }) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-white py-2.5 text-sm font-medium transition-colors ${className}`}
    >
      <Icon className="h-4 w-4" />
      {text}
    </a>
  );
}
