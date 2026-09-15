import { redirect } from 'next/navigation';
import { Users, IndianRupee, Clock3, Star } from 'lucide-react';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import ProfileCompletion from '@/components/dashboard/ProfileCompletion';
import PendingResumeCard from '@/components/dashboard/PendingResumeCard';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import QuickActions from '@/components/dashboard/overview/QuickActions';
import LiveStatusBanner from '@/components/dashboard/overview/LiveStatusBanner';
import {
  IncomingRequests, ActiveConsultations, PendingRequestsValue,
} from '@/components/dashboard/overview/LiveInbox';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import TodaySessions from '@/components/dashboard/overview/TodaySessions';
import EarningsCard from '@/components/dashboard/overview/EarningsCard';
import RecentConversations from '@/components/dashboard/overview/RecentConversations';
import StayOnlineBanner from '@/components/dashboard/overview/StayOnlineBanner';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById, getRawAdvocateById } from '@/lib/advocates';
import { fromRecord, completionOf } from '@/lib/profileCompletion';
import { getAdvocateConsultations } from '@/lib/consultations';
import { applyLegacyCommission } from '@/lib/payouts';
import { buildOverview, percentChange } from '@/lib/dashboardOverview';
import { lawyerProfileHref } from '@/utils/advocateUrl';

export default async function DashboardOverviewPage({ searchParams }) {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  const advocate = await getAdvocateById(id);
  if (!advocate) redirect('/login');

  const all = await getAdvocateConsultations(id);
  // Take the one-time commission on pre-commission balances before the balance
  // is read, so the overview never shows a figure the lawyer cannot withdraw.
  await applyLegacyCommission(id);
  // The record as stored, so the checklist counts what the lawyer entered
  // rather than what the public profile fills in on their behalf.
  const raw = await getRawAdvocateById(id);
  const progress = completionOf(fromRecord(raw || {}));

  // Rows the lawyer cleared drop out of the feed and the stats alike.
  const consultations = all.filter((c) => !c.hidden);
  const overview = buildOverview(consultations);
  const { today } = overview.periods;
  const todayChange = percentChange(today.earned, today.previousEarned);
  // Clients holding unused, still-valid time they can reconnect for free.
  const resumable = consultations.filter((c) => c.resumeLeftoverSeconds > 0);

  // Set by the signup route on the hop straight from "create my account".
  const params = await searchParams;
  const justJoined = params?.welcome === '1';

  const available = Boolean(advocate.available);

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardTopbar advocate={advocate} />

      {justJoined && (
        <WelcomeCard
          name={advocate.name}
          status={advocate.status}
          done={progress.done}
          total={progress.total}
        />
      )}

      <QuickActions advocate={raw || advocate} />

      <LiveStatusBanner initialAvailable={available} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <DashboardStatCard
          icon={Users}
          value={overview.totalSessions}
          label="Total Consultations"
          tone="primary"
          trend={overview.sessionsToday > 0 ? `↑ ${overview.sessionsToday} today` : null}
          sub={overview.sessionsToday > 0 ? null : 'None yet today'}
        />
        <DashboardStatCard
          icon={IndianRupee}
          value={`₹${today.earned.toLocaleString('en-IN')}`}
          label="Today's Earnings"
          tone="success"
          trend={todayChange !== null && todayChange >= 0 ? `↑ ${todayChange}%` : null}
          sub={todayChange !== null && todayChange < 0 ? `↓ ${Math.abs(todayChange)}% vs yesterday` : null}
        />
        <DashboardStatCard
          icon={Clock3}
          value={<PendingRequestsValue />}
          label="Pending Requests"
          tone="danger"
          sub="Live"
        />
        <DashboardStatCard
          icon={Star}
          value={advocate.rating ? Number(advocate.rating).toFixed(1) : '—'}
          label="Rating"
          tone="violet"
          sub={`(${advocate.reviews || 0} ${advocate.reviews === 1 ? 'review' : 'reviews'})`}
        />
      </div>

      <PendingResumeCard items={resumable} />

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <IncomingRequests initialAvailable={available} />
          <ActiveConsultations />
          <TodaySessions sessions={overview.today} />
          {progress.percent < 100 && <ProfileCompletion progress={progress} />}
        </div>

        <div className="min-w-0 space-y-5 sm:space-y-6">
          <EarningsCard
            periods={overview.periods}
            week={overview.week}
            walletBalance={raw?.walletBalance || 0}
          />
          <RecentConversations consultations={consultations} />
        </div>
      </div>

      <StayOnlineBanner
        initialAvailable={available}
        profileHref={lawyerProfileHref(advocate)}
      />
    </div>
  );
}
