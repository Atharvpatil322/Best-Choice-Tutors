import test from "node:test";
import assert from "node:assert/strict";
import { jsonForScript } from "../../frontend/src/utils/jsonForScript.js";

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

test("text from the admin panel cannot close the script tag", () => {
  const schema = {
    "@type": "Organization",
    name: "Tutors</script><img src=x onerror=alert(1)>",
    description: `A & B <!-- ${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}`,
  };
  const out = jsonForScript(schema);
  assert.ok(!out.includes("<"));
  assert.ok(!out.includes(">"));
  assert.ok(!out.includes("&"));
  assert.ok(!out.includes(LINE_SEPARATOR));
  assert.ok(!out.includes(PARAGRAPH_SEPARATOR));
});

test("the escaped output is still the same JSON", () => {
  const schema = { name: "x</script>&<b>", list: [1, "<a>"], nested: { ok: true } };
  assert.deepEqual(JSON.parse(jsonForScript(schema)), schema);
});
