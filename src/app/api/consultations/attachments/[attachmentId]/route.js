import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin';
import { getChatAttachment } from '@/lib/chatAttachments';
import { attachmentKind } from '@/constants/chatAttachments';
import { verifyAttachmentLink } from '@/lib/attachmentLinks';

export const dynamic = 'force-dynamic';

/**
 * GET /api/consultations/attachments/[attachmentId]?download=1
 * GET /api/consultations/attachments/[attachmentId]?e=<exp>&t=<sig>
 *
 * The second form is a signed link (lib/attachmentLinks), for the mobile app:
 * it opens the file in the phone's browser or viewer, which has no session.
 *
 * A file from a consultation chat, for the two people in that conversation
 * (or an admin). Images and PDFs open inline so they preview in the browser;
 * `download=1`, and every other type, comes down as a file.
 */
export async function GET(request, { params }) {
  const { attachmentId } = await params;
  const query = new URL(request.url).searchParams;
  const signed = verifyAttachmentLink(attachmentId, query.get('e'), query.get('t'));

  const [viewer, admin] = signed ? [null, null] : await Promise.all([getSession(), getAdminSession()]);
  if (!signed && !viewer && !admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  // A valid signature stands in for the admin check: it was only ever handed
  // to a participant, for this one file.
  const doc = await getChatAttachment(attachmentId, viewer, signed || Boolean(admin));
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const kind = attachmentKind(doc.fileName, doc.mimeType);
  const forceDownload = query.get('download') === '1';
  const inline = !forceDownload && (kind === 'image' || kind === 'pdf');
  const asciiName = doc.fileName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');

  const body = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data.buffer || doc.data);
  return new NextResponse(body, {
    headers: {
      'Content-Type': doc.mimeType || 'application/octet-stream',
      'Content-Length': String(body.length),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      // Private to the two of them — never in a shared cache.
      'Cache-Control': 'private, max-age=3600',
      // A file a stranger uploaded must not be sniffed into HTML and run.
      'X-Content-Type-Options': 'nosniff',
      // Sandboxed too, except PDFs: Chrome's built-in viewer refuses to render
      // under a sandbox CSP, and a PDF cannot carry script it would run anyway.
      ...(kind === 'pdf'
        ? {}
        : { 'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }),
    },
  });
}
