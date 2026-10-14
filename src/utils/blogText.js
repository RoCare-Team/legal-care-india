/**
 * Turn HTML into the plain blog format the article page renders: a blank line
 * between paragraphs and a leading "## " for a heading.
 *
 * Writing tools (n8n, ChatGPT, WordPress exports) post their articles as HTML.
 * The article page deliberately renders text, never markup, so without this
 * the tags showed on the page as literal "<p>" and "<h2>". Converting keeps
 * the structure — headings, paragraphs, lists — plus links as [text](url) and
 * bold as **text** (rendered by the page, see renderInline), and drops
 * everything else, so nothing posted can inject markup or script.
 *
 * Text with no tags is returned untouched, so plain-text articles are
 * unaffected.
 *
 * @param {string} input
 * @returns {string}
 */
export function htmlToBlogText(input = '') {
  const text = String(input || '');
  if (!/<\/?[a-z][^>]*>/i.test(text)) return text;

  let s = text.replace(/\r\n?/g, '\n');

  // Never keep what is not content.
  s = s.replace(/<(script|style|noscript|iframe|svg)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');

  // Links survive as [text](url) — first, so a link inside a heading or a
  // list item survives too. Quoted or unquoted href, any attribute order.
  // Only addresses safeUrl accepts become links; anything else (javascript:,
  // data:) keeps its words and loses the link.
  s = s.replace(
    /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi,
    (_, dq, sq, bare, inner) => {
      const label = decodeEntities(stripTags(inner)).replace(/\s+/g, ' ').trim();
      const url = safeUrl(decodeEntities(dq ?? sq ?? bare ?? '').trim());
      if (!label) return url ? `[${url}](${url})` : '';
      return url ? `[${label.replace(/[[\]]/g, '')}](${url})` : label;
    }
  );

  // Bold survives as **text**.
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    const t = stripTags(inner).trim();
    return t ? `**${t}**` : '';
  });

  // Headings of any level become the page's one heading style. Their links
  // and bold are already in [text](url) / **text** form, which stripTags
  // leaves alone.
  s = s.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, inner) => {
    const heading = stripTags(inner).replace(/\s+/g, ' ').trim();
    return heading ? `\n\n## ${heading}\n\n` : '\n\n';
  });

  // List items read as bullets, one per line.
  s = s.replace(/<li[^>]*>/gi, '\n• ');
  s = s.replace(/<\/li>/gi, '');

  // Line breaks and block ends.
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|div|section|article|blockquote|ul|ol|table|tr|header|footer)>/gi, '\n\n');
  s = s.replace(/<(p|div|section|article|blockquote|ul|ol|table|tr)[^>]*>/gi, '\n\n');

  // Everything else (links, bold, spans) keeps its words and loses its tag.
  s = decodeEntities(stripTags(s));

  return s
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    // A bullet list stays one block; anything else at most one blank line apart.
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(\n• [^\n]*)\n\n(?=• )/g, '$1\n')
    .trim();
}

/** Plain text of an HTML snippet (for an excerpt or a title). */
export function htmlToPlainLine(input = '') {
  const text = String(input || '');
  if (!/<\/?[a-z][^>]*>|&[a-z#0-9]+;/i.test(text)) return text;
  return decodeEntities(stripTags(text)).replace(/\s+/g, ' ').trim();
}

/**
 * An address safe to link to, or '' — a web page (https/http, or "www."
 * which is given https://), a path on this site, an email (mailto:) or a
 * phone number (tel:). Never javascript:, data: or anything else.
 */
export function safeUrl(url = '') {
  const u = String(url).trim();
  if (/^https?:\/\/[^\s<>"]+$/i.test(u)) return u;
  if (/^www\.[^\s<>"]+\.[^\s<>"]+$/i.test(u)) return `https://${u}`;
  if (/^\/(?!\/)[^\s<>"]*$/.test(u)) return u;
  if (/^#[\w-]*$/.test(u)) return u;
  if (/^mailto:[^\s<>"@]+@[^\s<>"]+$/i.test(u)) return u;
  if (/^tel:\+?[\d\s()-]{5,}$/i.test(u)) return u.replace(/\s+/g, '');
  return '';
}

function stripTags(s) {
  return s.replace(/<\/?[a-z][^>]*>/gi, '');
}

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—',
  hellip: '…', rupee: '₹', copy: '©', reg: '®', trade: '™', bull: '•',
};

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return NAMED[code.toLowerCase()] ?? m;
  });
}

/**
 * Split a paragraph into plain text, links and bold, for the article page to
 * render as elements — never as HTML. A link is `[text](url)` or an address
 * written straight into the text (https://…, www.…); either becomes a link
 * only to a safe address (see safeUrl), anything else stays as its words.
 * `**text**` is bold. Works the same for articles written in the admin panel.
 *
 * @param {string} text
 * @returns {Array<{type:'text'|'link'|'bold', text:string, href?:string}>}
 */
export function parseInline(text = '') {
  const out = [];
  const re = new RegExp(
    [
      // [text](url) — the url may hold one level of (parentheses), as
      // Wikipedia links do.
      String.raw`\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)`,
      // **bold**
      String.raw`\*\*([^*\n]+)\*\*`,
      // A bare address written straight into the text.
      String.raw`((?:https?:\/\/|www\.)[^\s<>"]*[^\s<>".,;:!?'")\]])`,
    ].join('|'),
    'gi'
  );
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) });
    if (m[1] !== undefined) {
      const href = safeUrl(m[2]);
      out.push(href ? { type: 'link', text: m[1], href } : { type: 'text', text: m[1] });
    } else if (m[3] !== undefined) {
      out.push({ type: 'bold', text: m[3] });
    } else {
      const href = safeUrl(m[4]);
      out.push(href ? { type: 'link', text: m[4], href } : { type: 'text', text: m[4] });
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}
