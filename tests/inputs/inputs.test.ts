/** Snapshot tests for hook input parsing
 *
 * This test suite validates that all captured hook payloads in this directory
 * can be successfully parsed by the hook input schema.
 *
 * To regenerate test data:
 *   deno task gen-test-data
 *
 * To update snapshots:
 *   deno test --update
 */

import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { dirname, fromFileUrl, join } from "@std/path";
import * as schemas from "../../schemas/hooks.ts";
import type { z } from "zod";

const testDir = dirname(fromFileUrl(import.meta.url));

async function testHookInput<T extends z.ZodTypeAny>(
  t: Deno.TestContext,
  filename: string,
  schema: T,
) {
  const path = join(testDir, `${filename}.json`);
  const raw = await Deno.readTextFile(path);
  const json = JSON.parse(raw);

  const result = schema.parse(json) as { hook_event_name: string };

  assertEquals(
    result.hook_event_name,
    filename,
    `hook_event_name mismatch in ${filename}.json`,
  );

  await assertSnapshot(t, result);
}

Deno.test("parse PostToolUse.json", async (t) => {
  await testHookInput(t, "PostToolUse", schemas.postToolUseInput);
});

Deno.test("parse PreToolUse.json", async (t) => {
  await testHookInput(t, "PreToolUse", schemas.preToolUseInput);
});

Deno.test("parse SessionEnd.json", async (t) => {
  await testHookInput(t, "SessionEnd", schemas.sessionEndInput);
});

Deno.test("parse SessionStart.json", async (t) => {
  await testHookInput(t, "SessionStart", schemas.sessionStartInput);
});

Deno.test("parse Stop.json", async (t) => {
  await testHookInput(t, "Stop", schemas.stopInput);
});

Deno.test("parse UserPromptSubmit.json", async (t) => {
  await testHookInput(t, "UserPromptSubmit", schemas.userPromptSubmitInput);
});
