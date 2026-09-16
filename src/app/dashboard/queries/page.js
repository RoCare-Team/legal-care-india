import { redirect } from 'next/navigation';
import { getSessionAdvocateId } from '@/lib/auth';
import { getQueriesForAdvocate } from '@/lib/queries';
import QueriesWorkspace from '@/components/dashboard/queries/QueriesWorkspace';

export const metadata = {
  title: 'Client Queries | Lawyer Portal',
  robots: { index: false, follow: false },
};

/** The pool moves as other lawyers take things, so never serve it from cache. */
export const dynamic = 'force-dynamic';

export default async function QueriesPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  const data = await getQueriesForAdvocate(id);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Client Queries</h1>
        <p className="mt-1 text-sm text-ink/55">
          Legal problems posted on the website. Take one for 1 credit and the client is yours to call.
        </p>
      </div>
      <QueriesWorkspace data={JSON.parse(JSON.stringify(data))} />
    </div>
  );
}
