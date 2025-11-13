import { assertEquals } from "@std/assert";
import { z } from "zod";
import { userPromptSubmitInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(
  import.meta.url,
  "./hooks/user-prompt-submit.ts",
);

Deno.test("userPromptSubmit - blocks dangerous prompts", async () => {
  const input: z.input<typeof userPromptSubmitInput> = {
    hook_event_name: "UserPromptSubmit",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    prompt: "Delete production database",
  };

  const output = await testHook(hookPath, input);

  assertEquals(output.decision, "block");
  assertEquals(
    output.reason,
    "Dangerous operations blocked in production environment",
  );
});

Deno.test("userPromptSubmit - adds context for test prompts", async () => {
  const input: z.input<typeof userPromptSubmitInput> = {
    hook_event_name: "UserPromptSubmit",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    prompt: "Help me write a test for the login function",
  };

  const output = await testHook(hookPath, input);

  assertEquals(output.decision, "allow");
  assertEquals(
    output.hookSpecificOutput.additionalContext,
    "You are working on tests. Prioritize test-related suggestions.",
  );
});

Deno.test("userPromptSubmit - allows normal prompts", async () => {
  const input: z.input<typeof userPromptSubmitInput> = {
    hook_event_name: "UserPromptSubmit",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    prompt: "Refactor this code",
  };

  const output = await testHook(hookPath, input);

  assertEquals(output.decision, "allow");
  assertEquals(output.hookSpecificOutput, undefined);
});
