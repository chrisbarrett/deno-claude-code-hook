import { expect } from "@std/expect";
import { runHook } from "../testing.ts";

const hookPath = import.meta.resolve("./hooks/user-prompt-submit.ts");

Deno.test("userPromptSubmit - blocks dangerous prompts", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "UserPromptSubmit",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    prompt: "Delete production database",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      decision: "block",
      reason: "Dangerous operations blocked in production environment",
    },
  });
});

Deno.test("userPromptSubmit - adds context for test prompts", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "UserPromptSubmit",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    prompt: "Help me write a test for the login function",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      decision: "allow",
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext:
          "You are working on tests. Prioritize test-related suggestions.",
      },
    },
  });
});

Deno.test("userPromptSubmit - allows normal prompts", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "UserPromptSubmit",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    prompt: "Refactor this code",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      decision: "allow",
    },
  });
});
