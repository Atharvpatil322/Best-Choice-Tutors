/**
 * Unit tests for the blog content helpers used by the admin blog editor.
 *
 * Older posts are stored as markdown-ish text. Opening one for editing must
 * convert it to HTML with the same structure the public page shows, or the
 * first save after an edit would flatten the post into a single paragraph.
 *
 * Run from the repo root: node --test tests/unit/*.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isHtmlContent, markdownToHtml } from '../../frontend/src/utils/blogContent.js';

test('converts headings and paragraphs line by line', () => {
  const html = markdownToHtml('Intro line.\n\n## What Is It?\n\nBody text.\n### Detail');
  assert.equal(html, '<p>Intro line.</p><h2>What Is It?</h2><p>Body text.</p><h3>Detail</h3>');
});

test('groups consecutive list lines into one list', () => {
  const html = markdownToHtml('- one\n- two\n* three\n\n1. first\n2. second');
  assert.equal(
    html,
    '<ul><li><p>one</p></li><li><p>two</p></li><li><p>three</p></li></ul>' +
      '<ol><li><p>first</p></li><li><p>second</p></li></ol>',
  );
});

test('switching list type closes the previous list', () => {
  const html = markdownToHtml('- bullet\n1. numbered');
  assert.equal(html, '<ul><li><p>bullet</p></li></ul><ol><li><p>numbered</p></li></ol>');
});

test('converts bold and links inside lines and list items', () => {
  const html = markdownToHtml('- **Exam years** matter\nSee [our tutors](https://bestchoicetutors.com/tutors).');
  assert.equal(
    html,
    '<ul><li><p><strong>Exam years</strong> matter</p></li></ul>' +
      '<p>See <a href="https://bestchoicetutors.com/tutors">our tutors</a>.</p>',
  );
});

test('a whole bold line becomes a bold paragraph', () => {
  assert.equal(markdownToHtml('**Key point**'), '<p><strong>Key point</strong></p>');
});

test('paragraphs keep real inline tags but escape a stray "<"', () => {
  // The public page renders older paragraph lines as HTML.
  assert.equal(markdownToHtml('grades < 5 are <em>low</em>'), '<p>grades &lt; 5 are <em>low</em></p>');
});

test('headings and list items stay plain text, as the public page showed them', () => {
  assert.equal(markdownToHtml('## Q&amp;A <b>'), '<h2>Q&amp;amp;A &lt;b&gt;</h2>');
  assert.equal(markdownToHtml('- Press <Enter> to continue'), '<ul><li><p>Press &lt;Enter&gt; to continue</p></li></ul>');
});

test('"**" inside a link URL does not become bold', () => {
  assert.equal(markdownToHtml('[t](http://x/**a**)'), '<p><a href="http://x/**a**">t</a></p>');
});

test('unsafe link schemes are left as text and quotes cannot break the href', () => {
  assert.equal(markdownToHtml('[x](javascript:alert(1))'), '<p>[x](javascript:alert(1))</p>');
  assert.equal(markdownToHtml('[x](a"onmouseover="y)'), '<p><a href="a&quot;onmouseover=&quot;y">x</a></p>');
});

test('handles Windows line endings and empty input', () => {
  assert.equal(markdownToHtml('## A\r\nB'), '<h2>A</h2><p>B</p>');
  assert.equal(markdownToHtml(''), '');
  assert.equal(markdownToHtml('   \n  '), '');
  assert.equal(markdownToHtml(undefined), '');
});

test('converted output is recognised as HTML, so it is not converted twice', () => {
  assert.equal(isHtmlContent('## Heading\nText'), false);
  assert.equal(isHtmlContent(markdownToHtml('## Heading\nText')), true);
});
