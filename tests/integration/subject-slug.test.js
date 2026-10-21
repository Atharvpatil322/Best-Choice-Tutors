/**
 * Subject page slug changes and the redirects they leave behind.
 *
 * Runs against a real MongoDB, which it empties first - point
 * TEST_MONGO_URI at a throwaway database, never a shared one. Skipped when
 * TEST_MONGO_URI is not set.
 *
 * Run from the repo root:
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27018/bct_test node --test tests/integration/*.test.js
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from '../../backend/node_modules/mongoose/index.js';
import Subject from '../../backend/models/Subject.js';
import Redirect from '../../backend/models/Redirect.js';
import PageSeo from '../../backend/models/PageSeo.js';
import { updateSubject, listSubjects, clearSubjectCache, SubjectValidationError } from '../../backend/services/subjectService.js';

const uri = process.env.TEST_MONGO_URI;
const skip = !uri && 'TEST_MONGO_URI not set';

before(async () => {
  if (skip) return;
  if (!/test/i.test(uri)) throw new Error('TEST_MONGO_URI must name a test database');
  await mongoose.connect(uri);
  await Promise.all([Subject.deleteMany({}), Redirect.deleteMany({}), PageSeo.deleteMany({})]);
  clearSubjectCache();
});

after(async () => {
  if (!skip) await mongoose.disconnect();
});

const redirectFrom = (sourcePath) => Redirect.findOne({ sourcePath }).lean();

test('every canonical subject gets a record with its usual slug', { skip }, async () => {
  const subjects = await listSubjects();
  assert.equal(subjects.length, 20);
  assert.equal(subjects.find((s) => s.name === 'Computer Science').slug, 'computer-science');
});

test('changing a slug leaves a 301 at the old address', { skip }, async () => {
  const { subject, redirect } = await updateSubject('English', { slug: 'english-tutors' });
  assert.equal(subject.slug, 'english-tutors');
  assert.equal(redirect.sourcePath, '/tutors/subject/english');
  assert.equal(redirect.targetUrl, '/tutors/subject/english-tutors');
  assert.equal(redirect.statusCode, 301);
});

test('a second change flattens the chain instead of adding a hop', { skip }, async () => {
  await updateSubject('English', { slug: 'english-tuition' });
  assert.equal((await redirectFrom('/tutors/subject/english')).targetUrl, '/tutors/subject/english-tuition');
  assert.equal((await redirectFrom('/tutors/subject/english-tutors')).targetUrl, '/tutors/subject/english-tuition');
});

test('moving back to an old slug removes the redirect that would now loop', { skip }, async () => {
  await updateSubject('English', { slug: 'english' });
  assert.equal(await redirectFrom('/tutors/subject/english'), null, 'a live page has no redirect away from it');
  assert.equal((await redirectFrom('/tutors/subject/english-tuition')).targetUrl, '/tutors/subject/english');
  const loops = await Redirect.find({ $expr: { $eq: ['$sourcePath', '$targetUrl'] } }).lean();
  assert.equal(loops.length, 0);
});

test('unticking "create a redirect" leaves the old address without one', { skip }, async () => {
  const { redirect } = await updateSubject('Physics', { slug: 'physics-tutors', createRedirect: false });
  assert.equal(redirect, null);
  assert.equal(await redirectFrom('/tutors/subject/physics'), null);
});

test('a page-level SEO override follows the page to its new address', { skip }, async () => {
  await PageSeo.create({ path: '/tutors/subject/biology', title: 'Biology override' });
  await updateSubject('Biology', { slug: 'biology-tutors' });
  assert.equal(await PageSeo.exists({ path: '/tutors/subject/biology' }), null);
  assert.ok(await PageSeo.exists({ path: '/tutors/subject/biology-tutors' }));
});

test('a slug another subject uses, or a malformed slug, is refused', { skip }, async () => {
  await assert.rejects(updateSubject('Chemistry', { slug: 'mathematics' }), SubjectValidationError);
  await assert.rejects(updateSubject('Chemistry', { slug: 'Chem Tutors!' }), SubjectValidationError);
  await assert.rejects(updateSubject('Chemistry', { seoTitle: { $gt: '' } }), SubjectValidationError);
});

test('page copy and search listing are saved', { skip }, async () => {
  const { subject } = await updateSubject('Music', {
    seoTitle: 'Music Tutors | Best Choice Tutors',
    metaDescription: 'Piano, guitar and theory tutors.',
    h1: 'Find a Music Tutor',
    intro: 'Lessons online or in person.',
    content: '<p>Grades 1 to 8.</p>',
  });
  assert.equal(subject.h1, 'Find a Music Tutor');
  assert.equal((await listSubjects()).find((s) => s.name === 'Music').metaDescription, 'Piano, guitar and theory tutors.');
});
