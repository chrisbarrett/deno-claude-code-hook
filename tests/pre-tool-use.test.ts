import { expect } from "@std/expect";
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
    permission_mode: "acceptEdits",
    tool_name: "Write",
    tool_input: {
      file_path: "/tmp/test.txt",
      content: "test content",
    },
  };

  const result = await testHook(hookPath, input);

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Write operations are blocked in this test",
      },
    },
  });
});

Deno.test("preToolUse - allows Read tool", async () => {
  const input: z.input<typeof preToolUseInput> = {
    hook_event_name: "PreToolUse",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    tool_name: "Read",
    tool_input: {
      file_path: "/tmp/test.txt",
    },
  };

  const result = await testHook(hookPath, input);

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: "Tool is allowed",
      },
    },
  });
});
