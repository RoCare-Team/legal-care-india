import { redirect } from 'next/navigation';
import { Wallet, MessagesSquare, Star, MessageSquare } from 'lucide-react';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import ProfileCompletion from '@/components/dashboard/ProfileCompletion';
import RecentConsultations from '@/components/dashboard/RecentConsultations';
import PendingResumeCard from '@/components/dashboard/PendingResumeCard';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById, getRawAdvocateById } from '@/lib/advocates';
import { fromRecord, completionOf } from '@/lib/profileCompletion';
import { getAdvocateConsultations } from '@/lib/consultations';

export default async function DashboardOverviewPage({ searchParams }) {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  const advocate = await getAdvocateById(id);
  if (!advocate) redirect('/login');

  const all = await getAdvocateConsultations(id);
  // The record as stored, so the checklist counts what the lawyer entered
  // rather than what the public profile fills in on their behalf.
  const raw = await getRawAdvocateById(id);
  const progress = completionOf(fromRecord(raw || {}));

  // Rows the lawyer cleared drop out of the feed and the stats alike.
  const consultations = all.filter((c) => !c.hidden);
  const done = consultations.filter((c) => c.charged);
  const earned = done.reduce((sum, c) => sum + c.price, 0);
  // Clients holding unused, still-valid time they can reconnect for free.
  const resumable = consultations.filter((c) => c.resumeLeftoverSeconds > 0);

  // Set by the signup route on the hop straight from "create my account".
  const params = await searchParams;
  const justJoined = params?.welcome === '1';

  return (
    <div className="space-y-6">
      {justJoined && (
        <WelcomeCard
          name={advocate.name}
          status={advocate.status}
          done={progress.done}
          total={progress.total}
        />
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          icon={Wallet}
          value={`₹${earned.toLocaleString('en-IN')}`}
          label="Total Earned"
          tone="success"
        />
        <DashboardStatCard
          icon={MessagesSquare}
          value={done.length}
          label="Consultations"
          tone="secondary"
        />
        <DashboardStatCard icon={Star} value={advocate.rating || 0} label="Average Rating" tone="accent" />
        <DashboardStatCard icon={MessageSquare} value={advocate.reviews || 0} label="Total Reviews" tone="primary" />
      </div>

      <PendingResumeCard items={resumable} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCompletion progress={progress} />
        <RecentConsultations consultations={consultations} />
      </div>
    </div>
  );
}
