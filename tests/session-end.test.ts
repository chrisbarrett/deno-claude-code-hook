import { assertEquals } from "@std/assert";
import { z } from "zod";
import { sessionEndInput } from "../schemas/hooks.ts";
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

  const output = await testHook(hookPath, input);

  // SessionEnd hooks typically don't return output
  assertEquals(output, undefined);
});

Deno.test("sessionEnd - handles logout reason", async () => {
  const input: z.input<typeof sessionEndInput> = {
    hook_event_name: "SessionEnd",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    reason: "logout",
  };

  const output = await testHook(hookPath, input);

  // SessionEnd hooks typically don't return output
  assertEquals(output, undefined);
});

Deno.test("sessionEnd - handles exit reason", async () => {
  const input: z.input<typeof sessionEndInput> = {
    hook_event_name: "SessionEnd",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    reason: "exit",
  };

  const output = await testHook(hookPath, input);

  // SessionEnd hooks typically don't return output
  assertEquals(output, undefined);
});
