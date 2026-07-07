import { redirect } from 'next/navigation';
import { Eye, PhoneCall, Star, MessageSquare } from 'lucide-react';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import ProfileCompletion from '@/components/dashboard/ProfileCompletion';
import RecentEnquiries from '@/components/dashboard/RecentEnquiries';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';

/** Build the completion checklist from which fields the profile has filled. */
function buildChecklist(a) {
  const P = '/dashboard/profile';
  return [
    { label: 'Basic details & photo', done: true, href: `${P}#basic` },
    { label: 'About section', done: Boolean(a.about), href: `${P}#about` },
    { label: 'Legal services', done: (a.legalServices || []).length > 0, href: `${P}#services` },
    { label: 'Office details & timing', done: Boolean(a.office?.address), href: `${P}#office` },
    { label: 'Contact details', done: Boolean(a.contact?.phone), href: `${P}#contact` },
    { label: 'Education & experience', done: (a.education || []).length > 0, href: `${P}#education` },
    { label: 'Certificates & awards', done: (a.certificates || []).length > 0, href: `${P}#certificates` },
    { label: 'Office gallery photos', done: (a.gallery || []).some((g) => g && g.url), href: `${P}#gallery` },
  ];
}

export default async function DashboardOverviewPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  const advocate = await getAdvocateById(id);
  if (!advocate) redirect('/login');

  const checklist = buildChecklist(advocate);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <DashboardStatCard icon={Eye} value="0" label="Profile Views" tone="primary" />
        <DashboardStatCard icon={PhoneCall} value="0" label="Enquiries" tone="secondary" />
        <DashboardStatCard icon={Star} value={advocate.rating || 0} label="Average Rating" tone="accent" />
        <DashboardStatCard icon={MessageSquare} value={advocate.reviews || 0} label="Total Reviews" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCompletion checklist={checklist} />
        <RecentEnquiries />
      </div>
    </div>
  );
}
