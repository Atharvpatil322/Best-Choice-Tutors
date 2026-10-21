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
 * page renders older posts' lines as HTML, and converting must not change what
 * readers already see.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeStrayAngles(text) {
  return text.replace(/<(?![a-zA-Z/!])/g, '&lt;');
}

/**
 * Apply the inline markers older posts use: **bold** and [text](url) links.
 *
 * @param {string} text
 * @returns {string}
 */
function inlineMarkdownToHtml(text) {
  return escapeStrayAngles(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

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
    list.items.push(inlineMarkdownToHtml(text));
  };

  content.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (line.startsWith('### ')) {
      closeList();
      blocks.push(`<h3>${inlineMarkdownToHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      closeList();
      blocks.push(`<h2>${inlineMarkdownToHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      addListItem('ul', line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      addListItem('ol', line.replace(/^\d+\.\s/, ''));
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      blocks.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
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
