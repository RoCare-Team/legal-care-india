import { getAllAppVersionSettings } from '@/lib/appVersion';
import { AdminPageHeader } from '@/components/admin/DataTable';
import AppVersionForm from '@/components/admin/AppVersionForm';

/** /admin/app-version — the app's store version and force-update switch. */
export const dynamic = 'force-dynamic';

export default async function AdminAppVersionPage() {
  const settings = await getAllAppVersionSettings();
  return (
    <div>
      <AdminPageHeader
        title="App Version"
        subtitle="Tell the app when an update is out, and force old builds to update. Builds are compared by build number."
      />
      <div className="space-y-6">
        {settings.map((s) => (
          <AppVersionForm key={s.platform} initial={s} />
        ))}
      </div>
    </div>
  );
}
