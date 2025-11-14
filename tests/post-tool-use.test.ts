import { assert, assertObjectMatch } from "@std/assert";
import type { z } from "zod";
import type { postToolUseInput } from "../schemas/hooks.ts";
import { resolveHookPath, testHook } from "../testing.ts";

const hookPath = resolveHookPath(import.meta.url, "./hooks/post-tool-use.ts");

Deno.test("postToolUse - adds context for interrupted bash command", async () => {
  const input: z.input<typeof postToolUseInput> = {
    hook_event_name: "PostToolUse",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    tool_name: "Bash",
    tool_input: {
      command: "sleep 100",
    },
    tool_response: {
      stdout: "",
      stderr: "",
      interrupted: true,
      isImage: false,
    },
  };

  const output = await testHook(hookPath, input);

  assert(output);
  assertObjectMatch(output, {
    decision: "allow",
    hookSpecificOutput: {
      additionalContext: "Command was interrupted",
    },
  });
});

Deno.test("postToolUse - allows successful bash command", async () => {
  const input: z.input<typeof postToolUseInput> = {
    hook_event_name: "PostToolUse",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    tool_name: "Bash",
    tool_input: {
      command: "echo hello",
    },
    tool_response: {
      stdout: "hello\n",
      stderr: "",
      interrupted: false,
      isImage: false,
    },
  };

  const output = await testHook(hookPath, input);

  assert(output);
  assertObjectMatch(output, {
    decision: "allow",
  });
});

Deno.test("postToolUse - handles real Bash payload format", async () => {
  // Real payload from Claude Code with interrupted and isImage fields
  const input: z.input<typeof postToolUseInput> = {
    hook_event_name: "PostToolUse",
    session_id: "2bbf6c7c-9e83-438d-acc6-ff8d7813beaf",
    transcript_path:
      "/Users/chris/.claude/projects/-Users-chris--config-nix-configuration/2bbf6c7c-9e83-438d-acc6-ff8d7813beaf.jsonl",
    cwd: "/Users/chris/.config/nix-configuration",
    permission_mode: "acceptEdits",
    tool_name: "Bash",
    tool_input: {
      command: "ls -la",
      description: "List files with details",
    },
    tool_response: {
      stdout: "",
      stderr: "",
      interrupted: false,
      isImage: false,
    },
  };

  const output = await testHook(hookPath, input);

  assert(output);
  assertObjectMatch(output, {
    decision: "allow",
  });
});

Deno.test("postToolUse - handles real Read payload format", async () => {
  // Real payload from Claude Code for Read tool
  const input: z.input<typeof postToolUseInput> = {
    hook_event_name: "PostToolUse",
    session_id: "test-session",
    transcript_path: "/tmp/transcript.json",
    cwd: "/tmp",
    permission_mode: "acceptEdits",
    tool_name: "Read",
    tool_input: {
      file_path: "/tmp/test.txt",
    },
    tool_response: {
      type: "text",
      file: {
        filePath: "/tmp/test.txt",
        content: "file contents here",
        numLines: 156,
        startLine: 1,
        totalLines: 156,
      },
    },
  };

  const output = await testHook(hookPath, input);

  assert(output);
  assertObjectMatch(output, {
    decision: "allow",
  });
});
