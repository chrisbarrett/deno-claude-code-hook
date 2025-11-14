/** Test utilities for E2E hook testing.
 *
 * These utilities help test hooks by executing them as subprocesses, piping
 * JSON via stdin, and capturing/parsing JSON from stdout.
 */

import $ from "@david/dax";
import type { genericInput } from "./schemas/hooks.ts";
import type { z } from "zod";

type HookResult = {
  status: number;
  stdout: string;
  stderr: string;
};

/**
 * Execute a hook script with JSON input via stdin and return parsed JSON output.
 *
 * Hooks MUST output only valid JSON or nothing to stdout. Mixed output will
 * cause this function to return undefined.
 *
 * @param hookPath - Absolute path to the hook script
 * @param input - Input object to serialize as JSON and pipe to stdin
 */
export const testHook = async <In extends z.input<typeof genericInput>>(
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

/**
 * Resolve a path relative to the test file's directory.
 *
 * @param testFileUrl - Pass import.meta.url from the test file
 * @param relativePath - Path relative to the test file (e.g., "./hook.ts")
 * @returns Absolute path to the target file
 */
export const resolveHookPath = (
  testFileUrl: string,
  relativePath: string,
): string => {
  return new URL(relativePath, testFileUrl).pathname;
};
