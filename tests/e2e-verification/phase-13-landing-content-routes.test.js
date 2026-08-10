/**
 * E2E verification: Phase 13 - Landing content routes
 *
 * Verifies that the editable landing content endpoints for "Why Choose Us"
 * and popular searches are registered by the backend route modules.
 * Run from repo root: node --test tests/e2e-verification/phase-13-landing-content-routes.test.js
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createRequire } from "node:module";

const requireFromBackend = createRequire(new URL("../../backend/package.json", import.meta.url));
const express = requireFromBackend("express");

let server;
let baseUrl;

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`);
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  return { status: response.status, body };
}

describe("Phase 13: Landing content routes", () => {
  before(async () => {
    const adminRoutes = (await import("../../backend/routes/adminRoutes.js")).default;
    const benefitRoutes = (await import("../../backend/routes/benefitRoutes.js")).default;
    const popularSearchRoutes = (await import("../../backend/routes/popularSearchRoutes.js")).default;

    const app = express();
    app.use(express.json());
    app.use("/api/admin", adminRoutes);
    app.use("/api/benefits", benefitRoutes);
    app.use("/api/why-choose-us", benefitRoutes);
    app.use("/api/benefit", benefitRoutes);
    app.use("/api/popular-searches", popularSearchRoutes);
    app.use("/api/popular-search", popularSearchRoutes);
    app.use((req, res) => res.status(404).json({ message: "Route not found" }));

    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (!server) return;
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("registers admin benefit route aliases", async () => {
    for (const path of [
      "/api/admin/benefits?limit=100",
      "/api/admin/why-choose-us?limit=100",
      "/api/admin/benefit?limit=100",
    ]) {
      const result = await get(path);
      assert.strictEqual(result.status, 401, `${path} should be protected, not missing`);
      assert.notStrictEqual(result.body.message, "Route not found");
    }
  });

  it("registers admin popular search route aliases", async () => {
    for (const path of [
      "/api/admin/popular-searches?limit=100",
      "/api/admin/popular-search?limit=100",
    ]) {
      const result = await get(path);
      assert.strictEqual(result.status, 401, `${path} should be protected, not missing`);
      assert.notStrictEqual(result.body.message, "Route not found");
    }
  });
});
