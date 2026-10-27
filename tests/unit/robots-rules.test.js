import test from "node:test";
import assert from "node:assert/strict";
import { robotsRuleLines } from "../../backend/services/seoContentService.js";

// Google's rule: the longest matching pattern wins, and Allow wins a tie.
// `$` anchors the end of the path.
function allowed(path, lines) {
  let best = { length: -1, allow: true };
  for (const line of lines) {
    const [kind, raw] = line.split(": ");
    const anchored = raw.endsWith("$");
    const rule = anchored ? raw.slice(0, -1) : raw;
    const hit = anchored ? path === rule : path.startsWith(rule);
    if (!hit) continue;
    const allow = kind === "Allow";
    if (rule.length > best.length || (rule.length === best.length && allow)) {
      best = { length: rule.length, allow };
    }
  }
  return best.allow;
}

const lines = robotsRuleLines();

test("crawlers can load the public data pages are built from", () => {
  for (const path of [
    "/api/blog/best-tutors-in-tower-hamlets",
    "/api/blog?page=1&limit=12",
    "/api/faq",
    "/api/benefits",
    "/api/popular-searches",
    "/api/public/subjects/mathematics",
    "/api/public/seo?path=/",
    "/api/tutors?subject=English",
  ]) {
    assert.equal(allowed(path, lines), true, path);
  }
});

test("the rest of the API and private areas stay blocked", () => {
  for (const path of [
    "/api/auth/me",
    "/api/admin/seo-tools",
    "/api/learner/bookings",
    "/api/bookings",
    "/api/user/notifications",
    "/api/tutor/profile",
    "/admin",
    "/tutor",
    "/tutor/bookings",
    "/login",
  ]) {
    assert.equal(allowed(path, lines), false, path);
  }
});

test("public site pages stay crawlable", () => {
  for (const path of ["/", "/blog/some-post", "/tutors", "/tutors/subject/english", "/about"]) {
    assert.equal(allowed(path, lines), true, path);
  }
});
