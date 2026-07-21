import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Mail, Phone, MapPin, Wallet, BadgeCheck, ExternalLink, Circle,
  GraduationCap, Award, Languages, Scale,
} from 'lucide-react';
import { adminGetAdvocateById } from '@/lib/admin';
import { AdminAvatar } from '@/components/admin/DataTable';
import {
  DetailBack, InfoCard, InfoRow, StatTile, ConsultationList, WalletList,
} from '@/components/admin/DetailKit';
import { formatDate } from '@/utils/formatters';

const ENQUIRY_TONE = {
  new: 'bg-blue-500/10 text-blue-600',
  pending: 'bg-amber-500/10 text-amber-600',
  confirmed: 'bg-emerald-500/10 text-emerald-600',
  declined: 'bg-rose-500/10 text-rose-600',
};

function Chips({ items, tone = 'bg-primary/8 text-primary/90' }) {
  if (!items || items.length === 0) return <span className="text-sm text-ink/30">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={s} className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${tone}`}>{s}</span>
      ))}
    </div>
  );
}

export default async function AdminAdvocateDetailPage({ params }) {
  const { id } = await params;
  const adv = await adminGetAdvocateById(id);
  if (!adv) notFound();

  const publicUrl = `/lawyers/${adv.slug}-${adv.legalCareId.toLowerCase()}`;
  const location = [adv.city, adv.state].filter(Boolean).join(', ');

  return (
    <div className="mx-auto max-w-5xl">
      <DetailBack href="/admin/advocates" label="Back to lawyers" />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
        <AdminAvatar name={adv.name} />
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 font-display text-2xl font-semibold text-ink">
            {adv.name}
            {adv.verified && <BadgeCheck className="h-5 w-5 text-primary" aria-hidden="true" />}
          </h2>
          <p className="font-mono text-xs text-ink/40">{adv.legalCareId} · joined {formatDate(adv.createdAt)}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${adv.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
            {adv.status}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${adv.available ? 'bg-emerald-500/10 text-emerald-600' : 'bg-ink/8 text-ink/50'}`}>
            <Circle className={`h-2 w-2 ${adv.available ? 'fill-emerald-500 text-emerald-500' : 'fill-ink/40 text-ink/40'}`} aria-hidden="true" />
            {adv.available ? 'Available' : 'Offline'}
          </span>
          <Link href={publicUrl} target="_blank" className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:border-primary/30 hover:text-primary">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            View profile
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Earnings balance" value={`₹${adv.walletBalance.toLocaleString('en-IN')}`} tone="text-emerald-600" />
        <StatTile label="Consultations" value={adv.stats.totalConsultations} />
        <StatTile label="Total earned" value={`₹${adv.stats.earned.toLocaleString('en-IN')}`} />
        <StatTile label="Enquiries" value={adv.stats.enquiries} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard title="Contact & identity">
          <InfoRow label="Email"><span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />{adv.email}</span></InfoRow>
          <InfoRow label="Phone"><span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />{adv.phone}</span></InfoRow>
          <InfoRow label="Location">{location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />{location}</span>}</InfoRow>
          <InfoRow label="Bar Council #">{adv.barCouncilNumber}</InfoRow>
          <InfoRow label="Experience">{adv.experience ? `${adv.experience} years` : ''}</InfoRow>
          <InfoRow label="Rating">{adv.reviews ? `${adv.rating} (${adv.reviews} reviews)` : 'No reviews'}</InfoRow>
        </InfoCard>

        <InfoCard title="Practice">
          <InfoRow label="Consultation fee">{adv.consultationFee ? `₹${adv.consultationFee}` : ''}</InfoRow>
          <div className="border-b border-ink/6 py-2.5">
            <p className="mb-1.5 text-sm text-ink/50">Specializations</p>
            <Chips items={adv.specializations} />
          </div>
          <div className="border-b border-ink/6 py-2.5">
            <p className="mb-1.5 text-sm text-ink/50">Sub-specializations</p>
            <Chips items={adv.subSpecializations} tone="bg-ink/6 text-ink/60" />
          </div>
          <div className="py-2.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-sm text-ink/50"><Languages className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />Languages</p>
            <Chips items={adv.languages} tone="bg-blue-500/10 text-blue-600" />
          </div>
        </InfoCard>

        {adv.about && (
          <InfoCard title="About" className="lg:col-span-2">
            {adv.tagline && <p className="mb-2 text-sm font-semibold text-ink/80">{adv.tagline}</p>}
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink/65">{adv.about}</p>
          </InfoCard>
        )}

        {adv.consultationPlans.length > 0 && (
          <InfoCard title="Live-chat plans">
            <ul className="divide-y divide-ink/6">
              {adv.consultationPlans.map((p, i) => (
                <li key={i} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-ink/70">{p.minutes} min</span>
                  <span className="text-sm font-semibold text-ink">₹{p.price}</span>
                </li>
              ))}
            </ul>
          </InfoCard>
        )}

        {(adv.office.name || adv.office.address) && (
          <InfoCard title="Office">
            <InfoRow label="Name">{adv.office.name}</InfoRow>
            <InfoRow label="Address">{adv.office.address}</InfoRow>
            <InfoRow label="Area">{adv.office.area}</InfoRow>
            <InfoRow label="Pincode">{adv.office.pincode}</InfoRow>
          </InfoCard>
        )}

        {adv.education.length > 0 && (
          <InfoCard title="Education">
            <ul className="space-y-3">
              {adv.education.map((e, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-ink/35" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-ink/80">{e.degree}</p>
                    <p className="text-xs text-ink/50">{[e.institute, e.year].filter(Boolean).join(' · ')}</p>
                  </div>
                </li>
              ))}
            </ul>
          </InfoCard>
        )}

        {(adv.certificates.length > 0 || adv.awards.length > 0) && (
          <InfoCard title="Certificates & awards">
            <ul className="space-y-3">
              {[...adv.certificates, ...adv.awards].map((c, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-ink/80">{c.title}</p>
                    <p className="text-xs text-ink/50">{[c.issuer, c.year].filter(Boolean).join(' · ')}</p>
                  </div>
                </li>
              ))}
            </ul>
          </InfoCard>
        )}

        <InfoCard
          title="Earnings ledger"
          className="lg:col-span-2"
          action={<span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Wallet className="h-3.5 w-3.5" aria-hidden="true" />₹{adv.walletBalance.toLocaleString('en-IN')}</span>}
        >
          <WalletList items={adv.walletTransactions} empty="No earnings yet." />
        </InfoCard>

        <InfoCard title="Consultation history" className="lg:col-span-2">
          <ConsultationList items={adv.consultations} perspective="advocate" empty="No consultations yet." />
        </InfoCard>

        <InfoCard title="Enquiries received" className="lg:col-span-2">
          {adv.enquiries.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/45">No enquiries yet.</p>
          ) : (
            <ul className="divide-y divide-ink/6">
              {adv.enquiries.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <Scale className="mt-0.5 h-4 w-4 shrink-0 text-ink/35" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{e.name} <span className="font-normal text-ink/45">· {e.phone}</span></p>
                      <p className="line-clamp-2 text-xs text-ink/55">{e.message}</p>
                      <p className="mt-0.5 text-[11px] text-ink/40">{formatDate(e.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${ENQUIRY_TONE[e.status] || ENQUIRY_TONE.new}`}>
                    {e.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
      </div>
    </div>
  );
}
