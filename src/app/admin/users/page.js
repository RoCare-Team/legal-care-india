import { adminGetUsers } from '@/lib/admin';
import { AdminPageHeader } from '@/components/admin/DataTable';
import UsersTable from '@/components/admin/UsersTable';

export default async function AdminUsersPage() {
  const users = await adminGetUsers();

  return (
    <div>
      <AdminPageHeader title="Users" subtitle="All registered client accounts." count={users.length} />
      <UsersTable users={users} />
    </div>
  );
}
