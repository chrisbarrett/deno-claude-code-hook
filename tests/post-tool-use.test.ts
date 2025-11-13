import { assertEquals } from "@std/assert";
import type { z } from "zod";
import type { postToolUseInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(import.meta.url, "./hooks/post-tool-use.ts");

Deno.test("postToolUse - adds context for failed bash command", async () => {
  const input: z.input<typeof postToolUseInput> = {
    hook_event_name: "PostToolUse",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    tool_name: "Bash",
    tool_input: {
      command: "exit 1",
    },
    tool_response: {
      exit_code: 1,
      stdout: "",
      stderr: "",
    },
  };

  const output = await testHook(hookPath, input);

  assertEquals(output.decision, "allow");
  assertEquals(
    output.hookSpecificOutput.additionalContext,
    "Command failed with exit code 1",
  );
});

Deno.test("postToolUse - allows successful bash command", async () => {
  const input: z.input<typeof postToolUseInput> = {
    hook_event_name: "PostToolUse",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    tool_name: "Bash",
    tool_input: {
      command: "echo hello",
    },
    tool_response: {
      exit_code: 0,
      stdout: "hello\n",
      stderr: "",
    },
  };

  const output = await testHook(hookPath, input);

  assertEquals(output.decision, "allow");
  assertEquals(output.hookSpecificOutput, undefined);
});
