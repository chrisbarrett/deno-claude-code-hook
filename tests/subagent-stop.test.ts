import { expect } from "@std/expect";
import type { z } from "zod";
import type { subagentStopInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(import.meta.url, "./hooks/subagent-stop.ts");

Deno.test("subagentStop - blocks stop when hook is not active", async () => {
  const input: z.input<typeof subagentStopInput> = {
    hook_event_name: "SubagentStop",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    stop_hook_active: false,
  };

  const result = await testHook(hookPath, input);

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      decision: "block",
      reason: "Please provide a summary of completed work",
    },
  });
});

Deno.test("subagentStop - allows stop when hook is already active", async () => {
  const input: z.input<typeof subagentStopInput> = {
    hook_event_name: "SubagentStop",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
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
