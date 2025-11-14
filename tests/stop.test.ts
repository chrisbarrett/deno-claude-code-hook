import { expect } from "@std/expect";
import { runHook } from "../testing.ts";

const hookPath = import.meta.resolve("./hooks/stop.ts");

Deno.test("stop - blocks stop when hook is not active", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "Stop",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    stop_hook_active: false,
  });

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
  const result = await runHook(hookPath, {
    hook_event_name: "Stop",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    stop_hook_active: true,
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: {
      suppressOutput: false,
      decision: "allow",
    },
  });
});
