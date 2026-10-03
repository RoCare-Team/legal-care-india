/**
 * What can be sent in a consultation chat. Shared by the picker (browser) and
 * the upload route (server), so the two can never disagree.
 *
 * The list is what legal work actually runs on: PDFs of notices and orders,
 * phone photos of paperwork, Word drafts, the odd spreadsheet of payments.
 * Executables, archives and anything else are refused — a zip from a stranger
 * is the classic way to deliver something nasty.
 */

/** 10 MB. A scanned 20-page PDF fits; a video does not, and should not. */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

const KINDS = {
  pdf: { exts: ['pdf'], mimes: ['application/pdf'] },
  image: {
    exts: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'],
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
  },
  doc: {
    exts: ['doc', 'docx', 'odt', 'rtf'],
    mimes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'application/rtf',
      'text/rtf',
    ],
  },
  sheet: {
    exts: ['xls', 'xlsx', 'csv'],
    mimes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
  },
  text: { exts: ['txt'], mimes: ['text/plain'] },
};

/** For the file input's `accept` attribute. */
export const ATTACHMENT_ACCEPT = Object.values(KINDS)
  .flatMap((k) => [...k.exts.map((e) => `.${e}`), ...k.mimes])
  .join(',');

/**
 * 'pdf' | 'image' | 'doc' | 'sheet' | 'text', or '' when the file is not
 * allowed. Decided by extension first — phones often send an empty or generic
 * mime type — and the mime type, when present, must not contradict it.
 */
export function attachmentKind(name, mimeType = '') {
  const ext = String(name || '').toLowerCase().split('.').pop();
  const mime = String(mimeType || '').toLowerCase();
  for (const [kind, k] of Object.entries(KINDS)) {
    if (!k.exts.includes(ext)) continue;
    if (!mime || mime === 'application/octet-stream' || k.mimes.includes(mime)) return kind;
  }
  return '';
}

/** "1.4 MB" / "320 KB". */
export function formatBytes(bytes = 0) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
