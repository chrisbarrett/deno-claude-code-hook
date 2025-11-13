import { assert } from "@std/assert/assert";
import { z } from "zod";

/** Returns max stdin buffer size (default 10 MiB). */
export const stdinMaxBufLen = (): number => {
  const dflt = 10 * 1024 * 1024;

  const { state } = Deno.permissions.querySync({
    name: "env",
    variable: "CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN",
  });

  if (state !== "granted") {
    return dflt;
  }

  const value = Deno.env.get("CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN");
  if (value === undefined) {
    return dflt;
  }

  const parsed = z.coerce.number().int().positive().safeParse(value);
  if (!parsed.success) {
    console.error(
      `[WARN] Invalid CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN: "${value}". Using default ${dflt} bytes.`,
    );
    return dflt;
  }

  return parsed.data;
};

/** Returns path to CLAUDE_ENV_FILE. Only available in SessionStart hooks. */
export const claudeEnvFile = () => {
  const value = Deno.env.get("CLAUDE_ENV_FILE");
  assert(value, "CLAUDE_ENV_FILE is only set in `SessionStart` hooks.");
  return value;
};
