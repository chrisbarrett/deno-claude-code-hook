import { expect } from "@std/expect";
import { runHook } from "../testing.ts";

const hookPath = import.meta.resolve("./hooks/subagent-stop.ts");

Deno.test("subagentStop - blocks stop when hook is not active", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "SubagentStop",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    stop_hook_active: false,
  });

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
  const result = await runHook(hookPath, {
    hook_event_name: "SubagentStop",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
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
