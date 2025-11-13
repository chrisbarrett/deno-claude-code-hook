import { assert, assertObjectMatch } from "@std/assert";
import type { z } from "zod";
import type { preToolUseInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(import.meta.url, "./hooks/pre-tool-use.ts");

Deno.test("preToolUse - blocks Write tool", async () => {
  const input: z.input<typeof preToolUseInput> = {
    hook_event_name: "PreToolUse",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    tool_name: "Write",
    tool_input: {
      file_path: "/tmp/test.txt",
      content: "test content",
    },
  };

  const output = await testHook(hookPath, input);

  assert(output);
  assertObjectMatch(output, {
    hookSpecificOutput: {
      permissionDecision: "deny",
      permissionDecisionReason: "Write operations are blocked in this test",
    },
  });
});

Deno.test("preToolUse - allows Read tool", async () => {
  const input: z.input<typeof preToolUseInput> = {
    hook_event_name: "PreToolUse",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    tool_name: "Read",
    tool_input: {
      file_path: "/tmp/test.txt",
    },
  };

  const output = await testHook(hookPath, input);

  assert(output);
  assertObjectMatch(output, {
    hookSpecificOutput: {
      permissionDecision: "allow",
      permissionDecisionReason: "Tool is allowed",
    },
  });
});
