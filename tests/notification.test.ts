import { expect } from "@std/expect";
import type { z } from "zod";
import type { notificationInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(import.meta.url, "./hooks/notification.ts");

Deno.test("notification - processes notification message", async () => {
  const input: z.input<typeof notificationInput> = {
    hook_event_name: "Notification",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    message: "Claude is waiting for your input",
  };

  const result = await testHook(hookPath, input);

  // Notification hooks typically don't return JSON output
  expect(result).toMatchObject({
    status: 0,
  });
});
