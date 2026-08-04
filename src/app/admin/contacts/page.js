import { adminGetContactMessages } from '@/lib/admin';
import { AdminPageHeader } from '@/components/admin/DataTable';
import ContactMessages from '@/components/admin/ContactMessages';

/**
 * /admin/contacts — everything sent through the public contact form.
 *
 * Read fresh on every visit rather than cached: an unanswered message that
 * shows up an hour late is the one thing this page must not do.
 */
export const dynamic = 'force-dynamic';

export default async function AdminContactsPage() {
  const messages = await adminGetContactMessages();
  const unread = messages.filter((m) => m.status === 'new').length;

  return (
    <div>
      <AdminPageHeader
        title="Contact Messages"
        subtitle={
          unread > 0
            ? `${unread} new ${unread === 1 ? 'message' : 'messages'} waiting for a reply.`
            : 'Messages sent through the contact form on the public site.'
        }
        count={messages.length}
      />
      <ContactMessages messages={messages} />
    </div>
  );
}
