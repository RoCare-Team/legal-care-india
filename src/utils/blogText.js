/**
 * Turn HTML into the plain blog format the article page renders: a blank line
 * between paragraphs and a leading "## " for a heading.
 *
 * Writing tools (n8n, ChatGPT, WordPress exports) post their articles as HTML.
 * The article page deliberately renders text, never markup, so without this
 * the tags showed on the page as literal "<p>" and "<h2>". Converting keeps
 * the structure — headings, paragraphs, lists — and drops everything else,
 * so nothing posted can inject markup or script into the page.
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

  // Headings of any level become the page's one heading style.
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
