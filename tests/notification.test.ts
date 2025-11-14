import { expect } from "@std/expect";
import { runHook } from "../testing.ts";

const hookPath = import.meta.resolve("./hooks/notification.ts");

Deno.test("notification - processes notification message", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "Notification",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    message: "Claude is waiting for your input",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: "",
  });
});
