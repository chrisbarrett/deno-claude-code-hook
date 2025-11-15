import { assert } from "@std/assert";
import * as path from "@std/path";
import { z } from "zod";
import { getLogger } from "./logging.ts";

/** Returns max stdin buffer size (default 10 MiB). */
export const stdinMaxBufLen = async (): Promise<number> => {
  const logger = await getLogger("config", "stdinMaxBufLen");

  const dflt = 10 * 1024 * 1024;

  const query = {
    name: "env",
    variable: "CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN",
  } as const;

  logger.trace("Checking permissions. {*}", { query });
  const { state } = Deno.permissions.querySync(query);

  if (state !== "granted") {
    logger.trace("Permission denied; returning default. {*}", {
      query,
      state,
      dflt,
    });
    return dflt;
  }

  logger.trace("Permission granted. {*}", { query, state });

  const value = Deno.env.get("CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN");
  if (value === undefined) {
    logger.trace("Environment variable not set; returning default. {*}", {
      dflt,
      state,
    });
    return dflt;
  }

  const parsed = z.coerce.number().int().positive().safeParse(value);
  if (!parsed.success) {
    logger.warn(
      `Invalid CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN: "${value}". Using default ${dflt} bytes.`,
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

/** Returns path to CLAUDE_ENV_FILE. Only available in SessionStart hooks. */
export const logFile = () => {
  const homeDir = Deno.env.get("HOME");
  assert(homeDir, "HOME environmentvariable not set");

  return path.join(homeDir, ".claude", "hooks.log");
};
