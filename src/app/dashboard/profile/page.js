import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/dashboard/EditProfileForm';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';

/** Flatten a full advocate profile into the editable form snapshot. */
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
    languages: a.languages || [],
    barCouncil: a.barCouncilNumber || '',
    experience: String(a.experience || ''),
    education: a.education || [],
    officeName: a.office?.name || '',
    officeAddress: a.office?.address || '',
    pincode: a.office?.pincode || '',
    timing: a.timing || [],
    phone: a.contact?.phone || '',
    whatsapp: a.contact?.whatsapp || '',
    email: a.contact?.email || '',
    fee: String(a.consultationFee || ''),
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Edit Profile</h1>
        <p className="mt-1 text-sm text-ink/55">
          Keep your profile complete and up to date — changes reflect on your public profile.
        </p>
      </div>
      <EditProfileForm initial={initial} previewHref={`/advocates/${advocate.slug}`} />
    </div>
  );
}
