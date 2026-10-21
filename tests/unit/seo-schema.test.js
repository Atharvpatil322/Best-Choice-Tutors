/**
 * Unit tests for the structured data builders and the head applier.
 *
 * The builders turn admin settings and records into schema.org JSON-LD; the
 * applier writes head tags into published pages. Both run without a
 * database.
 *
 * Run from the repo root: node --test tests/unit/*.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ORGANIZATION_ID,
  SITE_URL,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildBlogPostingSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  missingOrganizationFields,
} from '../../backend/services/seoSchemaBuilders.js';
import { applySeoHead } from '../../backend/services/seoHtmlService.js';

const PLACEHOLDER = /XXX|Your (Street|City|ZIP|State)|00\.000000/;

test('organization with no settings uses brand defaults and no placeholders', () => {
  const schema = buildOrganizationSchema({});
  assert.equal(schema['@type'], 'EducationalOrganization');
  assert.equal(schema['@id'], ORGANIZATION_ID);
  assert.equal(schema.name, 'Best Choice Tutors');
  assert.equal(schema.url, SITE_URL);
  assert.equal(schema.logo, `${SITE_URL}/logo.png`);
  for (const key of ['address', 'geo', 'telephone', 'email', 'openingHoursSpecification', 'priceRange', 'sameAs']) {
    assert.equal(key in schema, false, `${key} should be left out when empty`);
  }
  assert.doesNotMatch(JSON.stringify(schema), PLACEHOLDER);
});

test('organization publishes every filled field', () => {
  const schema = buildOrganizationSchema({
    type: 'OnlineBusiness',
    name: 'Best Choice Tutors',
    legalName: 'Best Choice Tutors Ltd',
    email: 'hello@example.com',
    telephone: '+44 20 1234 5678',
    logo: '/logo.png',
    sameAs: ['https://www.instagram.com/best.choice.tutors', ' '],
    foundingDate: '2024',
    founders: ['A Founder'],
    areaServed: ['United Kingdom'],
    knowsAbout: ['GCSE Maths tutoring'],
    priceRange: '£25-£60',
    companyNumber: '12345678',
    vatID: 'GB123456789',
    contactPoints: [
      { contactType: 'customer support', email: 'help@example.com', availableLanguage: ['English'] },
      { contactType: 'sales' },
    ],
    address: { streetAddress: '1 High Street', addressLocality: 'London', postalCode: 'N1 1AA', addressCountry: 'GB' },
    geo: { latitude: '51.5', longitude: '-0.12' },
    openingHours: [{ days: ['Monday', 'Funday'], opens: '09:00', closes: '17:00' }],
  });
  assert.equal(schema['@type'], 'OnlineBusiness');
  assert.equal(schema.legalName, 'Best Choice Tutors Ltd');
  assert.equal(schema.logo, `${SITE_URL}/logo.png`);
  assert.deepEqual(schema.sameAs, ['https://www.instagram.com/best.choice.tutors']);
  assert.deepEqual(schema.founder, [{ '@type': 'Person', name: 'A Founder' }]);
  assert.deepEqual(schema.areaServed, [{ '@type': 'Country', name: 'United Kingdom' }]);
  assert.equal(schema.contactPoint.length, 1, 'a contact point with no phone or email is dropped');
  assert.equal(schema.address.addressLocality, 'London');
  assert.deepEqual(schema.geo, { '@type': 'GeoCoordinates', latitude: 51.5, longitude: -0.12 });
  assert.deepEqual(schema.openingHoursSpecification[0].dayOfWeek, ['Monday']);
  assert.equal(schema.identifier.value, '12345678');
  assert.equal(schema.vatID, 'GB123456789');
});

test('online-only organizations leave out address, map position and hours', () => {
  const schema = buildOrganizationSchema({
    onlineOnly: true,
    address: { addressLocality: 'London' },
    geo: { latitude: '51.5', longitude: '-0.12' },
    openingHours: [{ days: ['Monday'], opens: '09:00', closes: '17:00' }],
  });
  assert.equal('address' in schema, false);
  assert.equal('geo' in schema, false);
  assert.equal('openingHoursSpecification' in schema, false);
});

test('a 0,0 map position is treated as unset', () => {
  assert.equal('geo' in buildOrganizationSchema({ geo: { latitude: '0', longitude: '0' } }), false);
});

test('website points at the organization', () => {
  const schema = buildWebSiteSchema({ websiteName: 'BCT' });
  assert.equal(schema.name, 'BCT');
  assert.deepEqual(schema.publisher, { '@id': ORGANIZATION_ID });
});

test('blog posting meets the article guidance', () => {
  const blog = {
    slug: 'my-post',
    title: 'A'.repeat(130),
    excerpt: 'Summary',
    author: 'Best Choice Tutors',
    category: 'Parents',
    imageUrl: 'https://cdn.example.com/img.png',
    imageAlt: 'Alt',
    publishedAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-05T10:00:00Z',
  };
  const schema = buildBlogPostingSchema(blog, {});
  assert.equal(schema['@type'], 'BlogPosting');
  assert.ok(schema.headline.length <= 110);
  assert.equal(schema.url, `${SITE_URL}/blog/my-post`);
  assert.equal(schema.datePublished, '2026-09-01T10:00:00.000Z');
  assert.equal(schema.dateModified, '2026-09-05T10:00:00.000Z');
  assert.equal(schema.author['@type'], 'Organization');
  assert.equal(schema.author['@id'], ORGANIZATION_ID);
  assert.deepEqual(schema.publisher, { '@id': ORGANIZATION_ID });
  assert.equal(schema.image[0].url, 'https://cdn.example.com/img.png');
  assert.equal(schema.articleSection, 'Parents');
});

test('a named author is a Person and missing dates are never invented', () => {
  const schema = buildBlogPostingSchema({ slug: 's', title: 'T', author: 'Jane Smith' }, {});
  assert.deepEqual(schema.author, { '@type': 'Person', name: 'Jane Smith' });
  assert.equal('datePublished' in schema, false);
  assert.equal('dateModified' in schema, false);
  assert.equal('image' in schema, false);
});

test('breadcrumbs need at least two items and use absolute URLs', () => {
  assert.equal(buildBreadcrumbSchema([{ name: 'Home', path: '/' }]), null);
  const schema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'English Tutors', path: '/tutors/subject/english' },
  ]);
  assert.equal(schema.itemListElement[1].item, `${SITE_URL}/tutors/subject/english`);
  assert.equal(schema.itemListElement[1].position, 2);
});

test('FAQ schema skips incomplete entries and returns null when empty', () => {
  assert.equal(buildFaqSchema([]), null);
  assert.equal(buildFaqSchema([{ question: 'Q', answer: ' ' }]), null);
  assert.equal(buildFaqSchema([{ question: 'Q', answer: 'A' }]).mainEntity.length, 1);
});

test('missing-field hints flag what an admin should fill in', () => {
  const missing = missingOrganizationFields({});
  assert.ok(missing.some((item) => item.startsWith('Email or telephone')));
  assert.ok(missing.some((item) => item.startsWith('Social profiles')));
  assert.equal(missingOrganizationFields({ onlineOnly: true }).some((item) => item.startsWith('Address')), false);
});

const SHELL = [
  '<html><head>',
  '<title>Default</title>',
  '<meta name="description" content="Default description" />',
  '<script type="application/ld+json">{"@type":"Old"}</script>',
  '</head><body></body></html>',
].join('\n');

const ENTRIES = [
  { key: 'title', html: '<title>Post | Brand</title>', owned: true },
  { key: 'name:description', html: '<meta name="description" content="Post summary" />', owned: false },
  { key: 'canonical', html: '<link rel="canonical" href="https://x/blog/p" />', owned: true },
  { key: 'jsonld', html: '<script type="application/ld+json">{"@type":"BlogPosting"}</script>', owned: true },
];

test('applying to the shell replaces every managed tag exactly once', () => {
  const html = applySeoHead(SHELL, ENTRIES);
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.match(html, /<title>Post \| Brand<\/title>/);
  assert.match(html, /content="Post summary"/);
  assert.doesNotMatch(html, /Default description/);
  assert.equal((html.match(/application\/ld\+json/g) || []).length, 1);
  assert.match(html, /BlogPosting/);
  assert.doesNotMatch(html, /"Old"/);
});

test('a prerendered page keeps its own copy unless the head owns the tag', () => {
  const prerendered = SHELL.replace('Default description', 'Page written description');
  const html = applySeoHead(prerendered, ENTRIES, { prerendered: true });
  assert.match(html, /Page written description/, 'not-owned description is kept');
  assert.match(html, /<title>Post \| Brand<\/title>/, 'owned title replaces');
  assert.match(html, /rel="canonical"/, 'missing tags are added');
});

test('dollar signs in content are inserted literally', () => {
  const html = applySeoHead(SHELL, [{ key: 'title', html: '<title>Save $& and $1</title>', owned: true }]);
  assert.match(html, /<title>Save \$& and \$1<\/title>/);
});

test('look-alike attributes and ">" inside values do not confuse the matcher', () => {
  const html = [
    '<html><head>',
    '<meta data-name="description" content="keep me" />',
    '<meta name="description" content="a > b, the old one" />',
    '<meta property="og:image:alt" content="alt stays" />',
    '</head><body></body></html>',
  ].join('\n');
  const result = applySeoHead(html, [
    { key: 'name:description', html: '<meta name="description" content="new" />', owned: true },
    { key: 'property:og:image', html: '<meta property="og:image" content="x.png" />', owned: true },
  ]);
  assert.match(result, /data-name="description" content="keep me"/);
  assert.doesNotMatch(result, /the old one/);
  assert.doesNotMatch(result, /b, the old one" \/>/);
  assert.match(result, /og:image:alt" content="alt stays"/, 'og:image does not match og:image:alt');
  assert.equal((result.match(/\sname="description"/g) || []).length, 1);
});

test('a document without </head> is returned unchanged', () => {
  const html = '<title>Keep</title><p>no head close</p>';
  assert.equal(applySeoHead(html, [{ key: 'title', html: '<title>New</title>', owned: true }]), html);
});

test('an empty owned JSON-LD entry removes structured data a type was switched off for', () => {
  const html = applySeoHead(SHELL, [{ key: 'jsonld', html: '', owned: true }], { prerendered: true });
  assert.doesNotMatch(html, /ld\+json/);
});
