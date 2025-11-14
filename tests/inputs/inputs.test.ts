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

  // For tool-specific files like "PreToolUse.Read", extract base hook name
  const baseHookName = filename.split(".")[0];

  assertEquals(
    result.hook_event_name,
    baseHookName,
    `hook_event_name mismatch in ${filename}.json`,
  );

  await assertSnapshot(t, result);
}

// Generic PreToolUse/PostToolUse tests removed - now testing tool-specific variants

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

// Tool-specific PreToolUse tests
Deno.test("parse PreToolUse.Read.json", async (t) => {
  await testHookInput(t, "PreToolUse.Read", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.Write.json", async (t) => {
  await testHookInput(t, "PreToolUse.Write", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.Edit.json", async (t) => {
  await testHookInput(t, "PreToolUse.Edit", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.Glob.json", async (t) => {
  await testHookInput(t, "PreToolUse.Glob", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.Bash.json", async (t) => {
  await testHookInput(t, "PreToolUse.Bash", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.Grep.json", async (t) => {
  await testHookInput(t, "PreToolUse.Grep", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.Task.json", async (t) => {
  await testHookInput(t, "PreToolUse.Task", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.NotebookEdit.json", async (t) => {
  await testHookInput(t, "PreToolUse.NotebookEdit", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.TodoWrite.json", async (t) => {
  await testHookInput(t, "PreToolUse.TodoWrite", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.WebFetch.json", async (t) => {
  await testHookInput(t, "PreToolUse.WebFetch", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.WebSearch.json", async (t) => {
  await testHookInput(t, "PreToolUse.WebSearch", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.SlashCommand.json", async (t) => {
  await testHookInput(t, "PreToolUse.SlashCommand", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.BashOutput.json", async (t) => {
  await testHookInput(t, "PreToolUse.BashOutput", schemas.preToolUseInput);
});

Deno.test("parse PreToolUse.KillShell.json", async (t) => {
  await testHookInput(t, "PreToolUse.KillShell", schemas.preToolUseInput);
});

// Tool-specific PostToolUse tests
Deno.test("parse PostToolUse.Read.json", async (t) => {
  await testHookInput(t, "PostToolUse.Read", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.Write.json", async (t) => {
  await testHookInput(t, "PostToolUse.Write", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.Edit.json", async (t) => {
  await testHookInput(t, "PostToolUse.Edit", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.Glob.json", async (t) => {
  await testHookInput(t, "PostToolUse.Glob", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.Bash.json", async (t) => {
  await testHookInput(t, "PostToolUse.Bash", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.Grep.json", async (t) => {
  await testHookInput(t, "PostToolUse.Grep", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.Task.json", async (t) => {
  await testHookInput(t, "PostToolUse.Task", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.NotebookEdit.json", async (t) => {
  await testHookInput(t, "PostToolUse.NotebookEdit", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.TodoWrite.json", async (t) => {
  await testHookInput(t, "PostToolUse.TodoWrite", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.WebFetch.json", async (t) => {
  await testHookInput(t, "PostToolUse.WebFetch", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.WebSearch.json", async (t) => {
  await testHookInput(t, "PostToolUse.WebSearch", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.SlashCommand.json", async (t) => {
  await testHookInput(t, "PostToolUse.SlashCommand", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.BashOutput.json", async (t) => {
  await testHookInput(t, "PostToolUse.BashOutput", schemas.postToolUseInput);
});

Deno.test("parse PostToolUse.KillShell.json", async (t) => {
  await testHookInput(t, "PostToolUse.KillShell", schemas.postToolUseInput);
});
