import { expect } from "@std/expect";
import type { z } from "zod";
import type { sessionStartInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(import.meta.url, "./hooks/session-start.ts");

Deno.test("sessionStart - handles startup source", async () => {
  const input: z.input<typeof sessionStartInput> = {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "startup",
  };

  const result = await testHook(hookPath, input);

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: "Fresh session started",
      },
    },
  });
});

Deno.test("sessionStart - handles resume source", async () => {
  const input: z.input<typeof sessionStartInput> = {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "resume",
  };

  const result = await testHook(hookPath, input);

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: "Resuming previous session",
      },
    },
  });
});

Deno.test("sessionStart - handles clear source", async () => {
  const input: z.input<typeof sessionStartInput> = {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "clear",
  };

  const result = await testHook(hookPath, input);

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: "Session cleared, starting fresh",
      },
    },
  });
});

Deno.test("sessionStart - handles compact source", async () => {
  const input: z.input<typeof sessionStartInput> = {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "compact",
  };

  const result = await testHook(hookPath, input);

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: "Session restarted after compaction",
      },
    },
  });
});
