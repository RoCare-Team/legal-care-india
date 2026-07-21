import { adminGetAdvocates } from '@/lib/admin';
import { AdminPageHeader } from '@/components/admin/DataTable';
import AdvocatesTable from '@/components/admin/AdvocatesTable';

export default async function AdminAdvocatesPage() {
  const advocates = await adminGetAdvocates();

  return (
    <div>
      <AdminPageHeader title="Lawyers" subtitle="All registered lawyers on the platform." count={advocates.length} />
      <AdvocatesTable advocates={advocates} />
    </div>
  );
}
