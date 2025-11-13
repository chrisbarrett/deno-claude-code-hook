import { assertEquals } from "@std/assert";
import { z } from "zod";
import { preToolUseInput } from "../schemas/hooks.ts";
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

  assertEquals(output.hookSpecificOutput.permissionDecision, "deny");
  assertEquals(
    output.hookSpecificOutput.permissionDecisionReason,
    "Write operations are blocked in this test",
  );
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

  assertEquals(output.hookSpecificOutput.permissionDecision, "allow");
  assertEquals(
    output.hookSpecificOutput.permissionDecisionReason,
    "Tool is allowed",
  );
});
