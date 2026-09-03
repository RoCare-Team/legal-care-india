import { SITE } from '@/constants/site';

/**
 * "Your profile is live" — sent to a lawyer the moment an admin publishes them.
 *
 * Written for the campaign API, so the only thing that varies per recipient is
 * `{{name|there}}`; every link is the same for everyone. That rules out a link
 * straight to each lawyer's own public profile, which would have to be built
 * per address — the dashboard is the better destination anyway, because the
 * three things this email asks them to do are all there.
 *
 * Table-based and inline-styled on purpose. Outlook still renders with Word's
 * engine, which ignores most of a stylesheet, and a layout that collapses in
 * the one client Indian offices actually use is not a layout.
 */
export function advocateApprovedEmail() {
  const dashboard = new URL('/dashboard', SITE.url).toString();
  const directory = new URL('/lawyers', SITE.url).toString();
  const support = SITE.email || 'support@justiceland.online';

  const subject = 'Your Justiceland profile is live';

  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

      <tr><td style="background:#1E3A5F;padding:24px;text-align:center;">
        <div style="font-size:19px;font-weight:700;letter-spacing:2px;color:#ffffff;">JUSTICELAND</div>
        <div style="font-size:12px;color:#D4AF37;margin-top:4px;">Verified advocates across India</div>
      </td></tr>

      <tr><td style="padding:28px 26px 8px;">
        <div style="display:inline-block;background:#ecfdf5;color:#059669;font-size:12px;font-weight:700;padding:5px 11px;border-radius:999px;">
          &#10003; APPROVED
        </div>
        <h1 style="margin:16px 0 0;font-size:22px;line-height:1.3;color:#0f172a;">
          Your profile is live, {{name|there}}
        </h1>
        <p style="margin:12px 0 0;font-size:14.5px;line-height:1.6;color:#475569;">
          Your registration has been reviewed and approved. Your profile is now
          in the public directory, and clients searching for a lawyer in your
          city and practice areas can find you and start a consultation.
        </p>
      </td></tr>

      <tr><td style="padding:22px 26px 6px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">
          Three things worth doing now
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 0 14px;">
            <div style="font-size:14.5px;font-weight:600;color:#0f172a;">1. Switch yourself online</div>
            <div style="font-size:13.5px;line-height:1.55;color:#64748b;">
              Clients can only book you while your availability is on. It is the
              switch at the top of your dashboard.
            </div>
          </td></tr>
          <tr><td style="padding:0 0 14px;">
            <div style="font-size:14.5px;font-weight:600;color:#0f172a;">2. Set your per-minute rates</div>
            <div style="font-size:13.5px;line-height:1.55;color:#64748b;">
              Chat, audio and video are priced separately. Clients are billed
              only for the minutes a consultation actually runs, and see your
              rate before they start.
            </div>
          </td></tr>
          <tr><td style="padding:0 0 4px;">
            <div style="font-size:14.5px;font-weight:600;color:#0f172a;">3. Finish your profile</div>
            <div style="font-size:13.5px;line-height:1.55;color:#64748b;">
              Bar Council enrolment, the courts you appear in, languages and
              your practice areas. Anything you have not filled in is left blank
              rather than guessed at &mdash; and a fuller profile is the one
              clients pick.
            </div>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:22px 26px 26px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#1E3A5F;border-radius:10px;">
              <a href="${dashboard}" style="display:inline-block;padding:13px 26px;font-size:14.5px;font-weight:600;color:#ffffff;text-decoration:none;">
                Open my dashboard
              </a>
            </td>
            <td style="width:10px;"></td>
            <td>
              <a href="${directory}" style="display:inline-block;padding:13px 20px;font-size:14.5px;font-weight:600;color:#1E3A5F;text-decoration:none;">
                See the directory
              </a>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="border-top:1px solid #e2e8f0;padding:18px 26px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
          Something not right on your profile, or a question about how
          consultations are billed? Reply to this email or write to
          <a href="mailto:${support}" style="color:#1E3A5F;">${support}</a> and
          a person will answer.
        </p>
      </td></tr>

      <tr><td style="background:#f8fafc;padding:16px 26px;text-align:center;">
        <p style="margin:0;font-size:11.5px;line-height:1.6;color:#94a3b8;">
          You are receiving this because you registered a practice on
          Justiceland and an administrator has just approved it.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>`.trim();

  return { subject, html };
}
