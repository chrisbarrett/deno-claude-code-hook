import { expect } from "@std/expect";
import type { z } from "zod";
import type { sessionEndInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(import.meta.url, "./hooks/session-end.ts");

Deno.test("sessionEnd - handles clear reason", async () => {
  const input: z.input<typeof sessionEndInput> = {
    hook_event_name: "SessionEnd",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    reason: "clear",
  };

  const result = await testHook(hookPath, input);

  // SessionEnd hooks typically don't return JSON output
  expect(result).toMatchObject({
    status: 0,
  });
});

Deno.test("sessionEnd - handles logout reason", async () => {
  const input: z.input<typeof sessionEndInput> = {
    hook_event_name: "SessionEnd",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    reason: "logout",
  };

  const result = await testHook(hookPath, input);

  // SessionEnd hooks typically don't return JSON output
  expect(result).toMatchObject({
    status: 0,
  });
});

Deno.test("sessionEnd - handles exit reason", async () => {
  const input: z.input<typeof sessionEndInput> = {
    hook_event_name: "SessionEnd",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    reason: "exit",
  };

  const result = await testHook(hookPath, input);

  // SessionEnd hooks typically don't return JSON output
  expect(result).toMatchObject({
    status: 0,
  });
});
