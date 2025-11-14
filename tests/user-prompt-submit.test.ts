import { expect } from "@std/expect";
import type { z } from "zod";
import type { userPromptSubmitInput } from "../schemas/hooks.ts";
import {
  resolveHookPath,
  testHook,
} from "@chrisbarrett/claude-code-hook/testing";

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
    permission_mode: "acceptEdits",
    prompt: "Delete production database",
  };

  const output = await testHook(hookPath, input);

  expect(output).toBeDefined();
  expect(output).toMatchObject({
    decision: "block",
    reason: "Dangerous operations blocked in production environment",
  });
});

Deno.test("userPromptSubmit - adds context for test prompts", async () => {
  const input: z.input<typeof userPromptSubmitInput> = {
    hook_event_name: "UserPromptSubmit",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    prompt: "Help me write a test for the login function",
  };

  const output = await testHook(hookPath, input);

  expect(output).toBeDefined();
  expect(output).toMatchObject({
    decision: "allow",
    hookSpecificOutput: {
      additionalContext:
        "You are working on tests. Prioritize test-related suggestions.",
    },
  });
});

Deno.test("userPromptSubmit - allows normal prompts", async () => {
  const input: z.input<typeof userPromptSubmitInput> = {
    hook_event_name: "UserPromptSubmit",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    prompt: "Refactor this code",
  };

  const output = await testHook(hookPath, input);

  expect(output).toBeDefined();
  expect(output).toMatchObject({
    decision: "allow",
  });
});
