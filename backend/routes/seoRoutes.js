/**
 * SEO Routes
 * Serves robots.txt, sitemap.xml and llms.txt generated from live database
 * content. Mounted at the site root because crawlers only look for these files
 * at fixed well-known locations.
 *
 * These must be registered before the single-page-app catch-all handler,
 * otherwise the SPA would answer with index.html instead.
 */

import express from 'express';
import {
  buildRobotsTxt,
  buildSitemapXml,
  buildLlmsTxt,
} from '../services/seoContentService.js';

const router = express.Router();

/** Seconds crawlers may reuse a cached copy before revalidating. */
const CACHE_MAX_AGE_SECONDS = 3600;

/**
 * GET /robots.txt
 * Crawl directives. Non-production environments return a blanket disallow.
 */
router.get('/robots.txt', async (req, res, next) => {
  try {
    const body = await buildRobotsTxt();
    res.type('text/plain; charset=utf-8');
    res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}`);
    res.send(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /sitemap.xml
 * Every indexable URL, including published blog posts and SEO-managed pages.
 */
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const xml = await buildSitemapXml();
    res.type('application/xml; charset=utf-8');
    res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}`);
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /llms.txt
 * Plain-text site summary for AI assistants, built from live blogs and FAQs.
 */
router.get('/llms.txt', async (req, res, next) => {
  try {
    const body = await buildLlmsTxt();
    res.type('text/plain; charset=utf-8');
    res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}`);
    res.send(body);
  } catch (err) {
    next(err);
  }
});

export default router;
