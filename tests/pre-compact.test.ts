import { expect } from "@std/expect";
import type { z } from "zod";
import type { preCompactInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(import.meta.url, "./hooks/pre-compact.ts");

Deno.test("preCompact - handles auto compaction", async () => {
  const input: z.input<typeof preCompactInput> = {
    hook_event_name: "PreCompact",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    trigger: "auto",
  };

  const output = await testHook(hookPath, input);

  // PreCompact hooks typically don't return output
  expect(output).toBeUndefined();
});

Deno.test("preCompact - handles manual compaction with instructions", async () => {
  const input: z.input<typeof preCompactInput> = {
    hook_event_name: "PreCompact",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    trigger: "manual",
    custom_instructions: "Keep important context about the API",
  };

  const output = await testHook(hookPath, input);

  // PreCompact hooks typically don't return output
  expect(output).toBeUndefined();
});

Deno.test("preCompact - handles manual compaction without instructions", async () => {
  const input: z.input<typeof preCompactInput> = {
    hook_event_name: "PreCompact",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    trigger: "manual",
    custom_instructions: "",
  };

  const output = await testHook(hookPath, input);

  // PreCompact hooks typically don't return output
  expect(output).toBeUndefined();
});
