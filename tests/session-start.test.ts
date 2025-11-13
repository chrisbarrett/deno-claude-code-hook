import { assertEquals } from "@std/assert";
import { z } from "zod";
import { sessionStartInput } from "../schemas/hooks.ts";
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

  const output = await testHook(hookPath, input);

  assertEquals(
    output.hookSpecificOutput.additionalContext,
    "Fresh session started",
  );
});

Deno.test("sessionStart - handles resume source", async () => {
  const input: z.input<typeof sessionStartInput> = {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "resume",
  };

  const output = await testHook(hookPath, input);

  assertEquals(
    output.hookSpecificOutput.additionalContext,
    "Resuming previous session",
  );
});

Deno.test("sessionStart - handles clear source", async () => {
  const input: z.input<typeof sessionStartInput> = {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "clear",
  };

  const output = await testHook(hookPath, input);

  assertEquals(
    output.hookSpecificOutput.additionalContext,
    "Session cleared, starting fresh",
  );
});

Deno.test("sessionStart - handles compact source", async () => {
  const input: z.input<typeof sessionStartInput> = {
    hook_event_name: "SessionStart",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    source: "compact",
  };

  const output = await testHook(hookPath, input);

  assertEquals(
    output.hookSpecificOutput.additionalContext,
    "Session restarted after compaction",
  );
});
