import { expect } from "@std/expect";
import { runHook } from "../testing.ts";

const hookPath = import.meta.resolve("./hooks/session-end.ts");

Deno.test("sessionEnd - handles clear reason", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "SessionEnd",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    reason: "clear",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: "",
  });
});

Deno.test("sessionEnd - handles logout reason", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "SessionEnd",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    reason: "logout",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: "",
  });
});

Deno.test("sessionEnd - handles exit reason", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "SessionEnd",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    reason: "exit",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: "",
  });
});
