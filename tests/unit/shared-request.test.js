import test from "node:test";
import assert from "node:assert/strict";
import { changeShared, forgetShared, sharedRequest } from "../../frontend/src/utils/sharedRequest.js";

test("callers within the time window share one request", async () => {
  let calls = 0;
  const load = async () => {
    calls += 1;
    return { n: calls };
  };
  const [a, b] = await Promise.all([sharedRequest("t1", load), sharedRequest("t1", load)]);
  assert.equal(calls, 1);
  assert.equal(a, b);
  await sharedRequest("t1", load);
  assert.equal(calls, 1);
});

test("an expired answer is fetched again", async () => {
  let calls = 0;
  const load = async () => ++calls;
  await sharedRequest("t2", load, 0);
  await sharedRequest("t2", load, 0);
  assert.equal(calls, 2);
});

test("a failed request is not kept", async () => {
  let calls = 0;
  const failing = async () => {
    calls += 1;
    throw new Error("down");
  };
  await assert.rejects(sharedRequest("t3", failing), /down/);
  await assert.rejects(sharedRequest("t3", failing), /down/);
  assert.equal(calls, 2);
});

test("forgetShared drops only keys with the prefix", async () => {
  let faq = 0;
  let other = 0;
  await sharedRequest("faqs:", async () => ++faq);
  await sharedRequest("faqs:English", async () => ++faq);
  await sharedRequest("benefits", async () => ++other);
  forgetShared("faqs:");
  await sharedRequest("faqs:", async () => ++faq);
  await sharedRequest("faqs:English", async () => ++faq);
  await sharedRequest("benefits", async () => ++other);
  assert.equal(faq, 4);
  assert.equal(other, 1);
});

test("after a change, requests for that data skip the browser cache", async () => {
  const seen = [];
  const load = async ({ fresh }) => seen.push(fresh);
  await sharedRequest("benefits-x", load);
  await sharedRequest("other-x", load);
  await changeShared("benefits-x", async () => "saved");
  await sharedRequest("benefits-x", load);
  await sharedRequest("other-x", load, 0);
  assert.deepEqual(seen, [false, false, true, false]);
});

test("changeShared clears the cache after a change, even a failed one", async () => {
  let calls = 0;
  const load = async () => ++calls;
  await sharedRequest("popular-searches", load);

  assert.equal(await changeShared("popular-searches", async () => "saved"), "saved");
  await sharedRequest("popular-searches", load);
  assert.equal(calls, 2);

  await assert.rejects(
    changeShared("popular-searches", async () => {
      throw new Error("conflict");
    }),
    /conflict/,
  );
  await sharedRequest("popular-searches", load);
  assert.equal(calls, 3);
});
