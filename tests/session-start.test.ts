import { expect } from "@std/expect";
import { runHook } from "../testing.ts";

const hookPath = import.meta.resolve("./hooks/session-start.ts");

Deno.test("sessionStart - handles startup source", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "startup",
  });

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
  const result = await runHook(hookPath, {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "resume",
  });

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
  const result = await runHook(hookPath, {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "clear",
  });

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
  const result = await runHook(hookPath, {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "compact",
  });

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
