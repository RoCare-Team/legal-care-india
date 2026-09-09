import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/dashboard/EditProfileForm';
import { getSessionAdvocateId } from '@/lib/auth';
import { getRawAdvocateById } from '@/lib/advocates';
import { getAllCities } from '@/lib/cities';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { toEditableSnapshot } from '@/lib/advocateSnapshot';

export default async function EditProfilePage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');
  // The stored record, with its images: the save endpoint writes `photo`
  // whenever the body carries one, so a form seeded without it would post an
  // empty string back and erase the lawyer's photograph.
  const advocate = await getRawAdvocateById(id, { withImages: true });
  if (!advocate) redirect('/login');

  const initial = toEditableSnapshot(advocate);
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
