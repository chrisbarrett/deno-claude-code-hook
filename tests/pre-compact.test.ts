import { expect } from "@std/expect";
import { runHook } from "../testing.ts";

const hookPath = import.meta.resolve("./hooks/pre-compact.ts");

Deno.test("preCompact - handles auto compaction", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "PreCompact",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    trigger: "auto",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: "",
  });
});

Deno.test("preCompact - handles manual compaction with instructions", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "PreCompact",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    trigger: "manual",
    custom_instructions: "Keep important context about the API",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: "",
  });
});

Deno.test("preCompact - handles manual compaction without instructions", async () => {
  const result = await runHook(hookPath, {
    hook_event_name: "PreCompact",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    trigger: "manual",
    custom_instructions: "",
  });

  expect(result).toMatchObject({
    status: 0,
    stdout: "",
  });
});
