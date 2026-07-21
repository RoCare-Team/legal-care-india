import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/dashboard/EditProfileForm';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';
import { getAllCities } from '@/lib/cities';
import { advocateProfilePath } from '@/utils/advocateUrl';

/** Flatten a full lawyer profile into the editable form snapshot. */
function toSnapshot(a) {
  return {
    fullName: a.name,
    photo: a.photo || '',
    coverImage: a.coverImage || '',
    gallery: (a.gallery || []).filter((g) => g && g.url),
    tagline: a.tagline || '',
    city: a.city,
    state: a.state,
    about: a.about || '',
    services: a.specializations || [],
    subServices: a.subSpecializations || [],
    languages: a.languages || [],
    courts: a.courts || [],
    practiceCities: a.practiceCities || [],
    barCouncil: a.barCouncilNumber || '',
    experience: String(a.experience || ''),
    cases: String(a.metrics?.cases || ''),
    clients: String(a.metrics?.clients || ''),
    successRate: String(a.metrics?.successRate || ''),
    education: a.education || [],
    officeName: a.office?.name || '',
    officeAddress: a.office?.address || '',
    pincode: a.office?.pincode || '',
    timing: a.timing || [],
    phone: a.contact?.phone || '',
    whatsapp: a.contact?.whatsapp || '',
    email: a.contact?.email || '',
    fee: String(a.consultationFee || ''),
    // Live-chat plans the lawyer defined (duration + price), as form strings.
    consultationPlans: (a.consultationPlans || []).map((p) => ({
      minutes: String(p.minutes ?? ''),
      price: String(p.price ?? ''),
    })),
    certificates: a.certificates || [],
    awards: a.awards || [],
    social: {
      linkedin: a.social?.linkedin || '',
      website: a.social?.website || '',
      facebook: a.social?.facebook || '',
      twitter: a.social?.twitter || '',
    },
  };
}

export default async function EditProfilePage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');
  const advocate = await getAdvocateById(id);
  if (!advocate) redirect('/login');

  const initial = toSnapshot(advocate);
  // Built-in cities PLUS the ones an admin added, so a newly added city is
  // immediately pickable here instead of only on the public site.
  const cities = await getAllCities();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Edit Profile</h1>
        <p className="mt-1 text-sm text-ink/55">
          Keep your profile complete and up to date — changes reflect on your public profile.
        </p>
      </div>
      <EditProfileForm
        initial={initial}
        cities={cities}
        previewHref={`/lawyers/${advocateProfilePath(advocate)}`}
      />
    </div>
  );
}
