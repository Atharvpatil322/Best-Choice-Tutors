/**
 * Blog content rendering helpers.
 *
 * Posts written in the rich text editor are stored as HTML. Posts written
 * before it existed are plain text with markdown-ish markers, and there are
 * still some in the database, so both have to render. These helpers decide
 * which is which and make the HTML safe to inject.
 */

import DOMPurify from 'dompurify';

/**
 * Whether a stored post is HTML rather than the older markdown-ish text.
 * Looks for a block-level tag: the editor always wraps content in one, and
 * markdown text never contains them.
 *
 * @param {string} content
 * @returns {boolean}
 */
export function isHtmlContent(content) {
  if (typeof content !== 'string') return false;
  return /<(p|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|blockquote|pre|img|hr|div)\b[^>]*>/i.test(
    content,
  );
}

/**
 * Escape a stray "<" that does not start a tag, so text such as "grades < 5"
 * survives being parsed as HTML. Real inline tags are left alone: the public
 * page renders older posts' paragraph lines as HTML, and converting must not
 * change what readers already see.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeStrayAngles(text) {
  return text.replace(/<(?![a-zA-Z/!])/g, '&lt;');
}

/**
 * Escape text completely. The public page shows older posts' headings and
 * list items as plain text, so "<Enter>" or "&amp;" there must stay literal.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeAll(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const BOLD_SPAN = /(\*\*[^*]+\*\*)/g;

/**
 * Build a link, or keep the original text when the URL is unsafe. The URL is
 * attribute-escaped so it cannot break out of the href.
 *
 * @param {string} label - Raw link text.
 * @param {string} url - Raw URL.
 * @param {(text: string) => string} escapeText - Escaping for the line's context.
 * @returns {string}
 */
function linkHtml(label, url, escapeText) {
  if (/^\s*(javascript|data|vbscript):/i.test(url)) return escapeText(`[${label}](${url})`);
  const href = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<a href="${href}">${escapeText(label)}</a>`;
}

/**
 * Apply the inline markers older posts use: [text](url) links and **bold**.
 *
 * Mirrors how the public page rendered them. Bold spans were shown through
 * React as plain text, so their contents are always fully escaped. The text
 * around them was HTML in paragraphs and plain text in headings and list items,
 * which the caller chooses with `escapeText`.
 *
 * Links are swapped for placeholders first, so "**" inside a URL cannot turn
 * into a <strong> tag in the middle of an href. Bold and links are also applied
 * in headings and list items, where the public page used to show the markers
 * literally - converting those is a deliberate fix, since authors clearly meant
 * them as formatting.
 *
 * @param {string} text - Raw line text.
 * @param {(text: string) => string} escapeText - Escaping for non-bold text.
 * @returns {string}
 */
function inlineMarkdownToHtml(text, escapeText) {
  const links = [];
  const withPlaceholders = text.replace(LINK_PATTERN, (_, label, url) => {
    links.push(linkHtml(label, url, escapeText));
    return `\u0000${links.length - 1}\u0000`;
  });
  return withPlaceholders
    .split(BOLD_SPAN)
    .map((part) =>
      part.length > 4 && part.startsWith('**') && part.endsWith('**')
        ? `<strong>${escapeAll(part.slice(2, -2))}</strong>`
        : escapeText(part),
    )
    .join('')
    .replace(/\u0000(\d+)\u0000/g, (_, index) => links[Number(index)]);
}

/** Inline conversion for lines the public page rendered as HTML. */
const paragraphHtml = (text) => inlineMarkdownToHtml(text, escapeStrayAngles);

/** Inline conversion for lines the public page rendered as plain text. */
const plainTextHtml = (text) => inlineMarkdownToHtml(text, escapeAll);

/**
 * Convert an older markdown-ish post into HTML the rich text editor can load.
 *
 * The editor parses whatever it is given as HTML, so loading the raw text
 * would collapse every line into one paragraph and show "## " literally - and
 * saving would then store that flattened version over the original. The rules
 * match the line-by-line rendering in BlogDetail, so a converted post looks
 * the same once saved. Consecutive list lines become a single list.
 *
 * @param {string} content - Plain-text post body.
 * @returns {string} HTML for the editor.
 */
export function markdownToHtml(content) {
  if (typeof content !== 'string' || !content.trim()) return '';

  const blocks = [];
  let list = null;

  const closeList = () => {
    if (!list) return;
    blocks.push(`<${list.tag}>${list.items.map((item) => `<li><p>${item}</p></li>`).join('')}</${list.tag}>`);
    list = null;
  };

  const addListItem = (tag, text) => {
    if (list && list.tag !== tag) closeList();
    if (!list) list = { tag, items: [] };
    list.items.push(plainTextHtml(text));
  };

  content.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (line.startsWith('### ')) {
      closeList();
      blocks.push(`<h3>${plainTextHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      closeList();
      blocks.push(`<h2>${plainTextHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      addListItem('ul', line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      addListItem('ol', line.replace(/^\d+\.\s/, ''));
    } else if (line.trim() === '') {
      closeList();
    } else if (line.length > 4 && line.startsWith('**') && line.endsWith('**')) {
      // The public page shows such a line wholly bold, as plain text, with
      // every "**" removed - including any in the middle.
      closeList();
      blocks.push(`<p><strong>${escapeAll(line.replace(/\*\*/g, ''))}</strong></p>`);
    } else {
      closeList();
      blocks.push(`<p>${paragraphHtml(line)}</p>`);
    }
  });
  closeList();

  return blocks.join('');
}

/**
 * Sanitise editor HTML for rendering.
 *
 * The content is admin-authored, but it still passes through here: an admin
 * account could be compromised, and content pasted from the web can carry
 * scripts or event handlers the author never sees. Everything the editor can
 * produce survives; scripts, iframes and on* handlers do not.
 *
 * @param {string} html
 * @returns {string} HTML safe to pass to dangerouslySetInnerHTML.
 */
export function sanitizeBlogHtml(html) {
  if (typeof html !== 'string' || !html) return '';
  const clean = DOMPurify.sanitize(html, {
    // colspan/rowspan carry merged cells; colgroup uses style for column widths.
    ADD_ATTR: ['colspan', 'rowspan', 'target', 'rel', 'style'],
    ADD_TAGS: ['colgroup', 'col'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  });
  return wrapTables(clean);
}

/**
 * Put each table in a horizontally scrolling box.
 *
 * A table pasted from a spreadsheet is often wider than a phone screen, and
 * without this the whole article scrolls sideways instead of just the table.
 * Runs on already-sanitised markup, and returns it unchanged where there is no
 * DOM to work with, such as a non-browser build step.
 *
 * @param {string} html - Sanitised HTML.
 * @returns {string}
 */
function wrapTables(html) {
  if (!html.includes('<table') || typeof window === 'undefined' || !window.DOMParser) {
    return html;
  }
  const doc = new window.DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  doc.body.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.classList.contains('blog-table-scroll')) return;
    const wrapper = doc.createElement('div');
    wrapper.className = 'blog-table-scroll';
    table.replaceWith(wrapper);
    wrapper.appendChild(table);
  });
  return doc.body.innerHTML;
}
