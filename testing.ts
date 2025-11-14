/**
 * Test utilities for end-to-end hook testing.
 *
 * This module provides utilities to test Claude Code hooks by executing them
 * as subprocesses with JSON input/output, just like Claude Code does in production.
 *
 * ## Usage
 *
 * Use {@link runHook} to execute a hook script and verify its behavior:
 *
 * ```typescript
 * import { expect } from "@std/expect";
 * import { runHook } from "jsr:@chrisbarrett/claude-code-hook/testing";
 *
 * const hookPath = import.meta.resolve("./hooks/my-hook.ts");
 *
 * Deno.test("my hook works correctly", async () => {
 *   const result = await runHook(hookPath, {
 *     hook_event_name: "SessionStart",
 *     session_id: "test",
 *     transcript_path: "/tmp/test.json",
 *     cwd: "/tmp",
 *     source: "startup",
 *   });
 *
 *   expect(result.status).toBe(0);
 *   expect(result.stdout).toMatchObject({
 *     hookSpecificOutput: {
 *       hookEventName: "SessionStart",
 *     },
 *   });
 * });
 * ```
 *
 * ## Automatic JSON Parsing
 *
 * If stdout or stderr start with `{`, they're automatically parsed as JSON.
 * This makes it easy to write assertions against structured hook output:
 *
 * ```typescript
 * const result = await runHook(hookPath, input);
 * // If hook outputs JSON, result.stdout is already an object
 * expect(result.stdout.decision).toBe("allow");
 * ```
 *
 * @module
 */

import $ from "@david/dax";
import type { genericInput } from "./schemas/hooks.ts";
import type { z } from "zod";

/**
 * Result from executing a hook script.
 */
type HookResult = {
  /** Exit code from the hook process (0 = success) */
  status: number;
  /** Hook's standard output. If it starts with '{', it will be parsed as JSON. */
  stdout: string;
  /** Hook's standard error output. If it starts with '{', it will be parsed as JSON. */
  stderr: string;
};

/**
 * Execute a hook script as a subprocess with JSON input via stdin.
 *
 * This function runs your hook script using Deno with full permissions, pipes the
 * input as JSON to stdin, and captures both stdout and stderr. Any output that
 * starts with '{' is automatically parsed as JSON for convenient assertion writing.
 *
 * @param hookPath - Path to the hook script. Use `import.meta.resolve("./path/to/hook.ts")` to get the absolute path.
 * @param input - Hook input object that will be serialized as JSON and piped to stdin
 * @returns Promise resolving to the hook's exit status and output
 *
 * @example Basic usage
 * ```typescript
 * import { expect } from "@std/expect";
 * import { runHook } from "jsr:@chrisbarrett/claude-code-hook/testing";
 *
 * const hookPath = import.meta.resolve("./hooks/session-start.ts");
 *
 * Deno.test("sessionStart hook adds context", async () => {
 *   const result = await runHook(hookPath, {
 *     hook_event_name: "SessionStart",
 *     session_id: "test-session",
 *     transcript_path: "/tmp/transcript.json",
 *     cwd: "/tmp",
 *     source: "startup",
 *   });
 *
 *   expect(result).toMatchObject({
 *     status: 0,
 *     stdout: {
 *       hookSpecificOutput: {
 *         hookEventName: "SessionStart",
 *         additionalContext: "Fresh session started",
 *       },
 *     },
 *   });
 * });
 * ```
 *
 * @example Testing hooks that block operations
 * ```typescript
 * Deno.test("preToolUse hook blocks access to .env files", async () => {
 *   const result = await runHook(hookPath, {
 *     hook_event_name: "PreToolUse",
 *     session_id: "test-session",
 *     transcript_path: "/tmp/transcript.json",
 *     cwd: "/tmp",
 *     permission_mode: "acceptEdits",
 *     tool_name: "Read",
 *     tool_input: { file_path: "/app/.env.production" },
 *   });
 *
 *   expect(result).toMatchObject({
 *     status: 0,
 *     stdout: {
 *       hookSpecificOutput: {
 *         hookEventName: "PreToolUse",
 *         permissionDecision: "deny",
 *         permissionDecisionReason: "Access to .env files is not allowed",
 *       },
 *     },
 *   });
 * });
 * ```
 */
export const runHook = async <In extends z.input<typeof genericInput>>(
  hookPath: string,
  input: In,
): Promise<HookResult> => {
  const result = await $`deno run --allow-all ${hookPath}`
    .stdout("piped")
    .stderr("piped")
    .stdinText(JSON.stringify(input));

  const parseIfJson = (str: string) => {
    if (!str || !str.trim().startsWith("{")) {
      return str;
    }
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  return {
    status: result.code,
    stdout: parseIfJson(result.stdout),
    stderr: parseIfJson(result.stderr),
  };
};
