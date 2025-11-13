/** Test utilities for E2E hook testing.
 *
 * These utilities help test hooks by executing them as subprocesses, piping
 * JSON via stdin, and capturing/parsing JSON from stdout.
 */

import $ from "@david/dax";

/**
 * Execute a hook script with JSON input via stdin and return parsed JSON output.
 *
 * Hooks MUST output only valid JSON or nothing to stdout. Mixed output will
 * cause this function to return undefined.
 *
 * @param hookPath - Absolute path to the hook script
 * @param input - Input object to serialize as JSON and pipe to stdin
 * @returns Parsed JSON output from stdout, or undefined if no output
 */
export const testHook = async (
  hookPath: string,
  input: unknown,
): Promise<object | undefined> => {
  const result = await $`deno run --allow-all ${hookPath}`
    .stdinText(JSON.stringify(input))
    .text();

  return result.trim() ? JSON.parse(result) : undefined;
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
