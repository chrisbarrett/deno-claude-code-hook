import { expect } from "@std/expect";
import type { z } from "zod";
import type { stopInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(import.meta.url, "./hooks/stop.ts");

Deno.test("stop - blocks stop when hook is not active", async () => {
  const input: z.input<typeof stopInput> = {
    hook_event_name: "Stop",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    stop_hook_active: false,
  };

  const result = await testHook(hookPath, input);

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      decision: "block",
      reason: "Please verify the changes before stopping",
    },
  });
});

Deno.test("stop - allows stop when hook is already active", async () => {
  const input: z.input<typeof stopInput> = {
    hook_event_name: "Stop",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    stop_hook_active: true,
  };

  const result = await testHook(hookPath, input);

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      decision: "allow",
    },
  });
});
