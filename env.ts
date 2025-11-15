import { assert } from "@std/assert";
import * as path from "@std/path";
import { z } from "zod";
import { getLogger } from "./logging.ts";

/** Returns max stdin buffer size (default 10 MiB). */
export const stdinMaxBufLen = (): number => {
  const dflt = 10 * 1024 * 1024;
  const variable = "CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN";

  const logger = getLogger().getChild(["env", "stdinMaxBufLen"]).with({
    variable,
    default: dflt,
  });

  const query = { name: "env", variable } as const;

  logger.debug("Checking permissions. {*}", { query });
  const { state } = Deno.permissions.querySync(query);

  if (state !== "granted") {
    logger.debug(
      "Permission check returned {state}; falling back to default of {default}",
      { state },
    );
    return dflt;
  }

  logger.debug("Permission granted. {*}", { query, state });

  const value = Deno.env.get(variable);
  if (value === undefined) {
    logger.debug("{variable} variable not set; returning default {default}");
    return dflt;
  }

  const parsed = z.coerce.number().int().positive().safeParse(value);
  if (!parsed.success) {
    logger.warn(
      `Invalid value: "{value}". Falling back to default of {default}.`,
      { value },
    );
    return dflt;
  }

  return parsed.data;
};

/** Returns path to CLAUDE_ENV_FILE. Only available in SessionStart hooks. */
export const claudeEnvFile = () => {
  const logger = getLogger().getChild(["env", "claudeEnvFile"]);

  logger.debug("Retrieving CLAUDE_ENV_FILE");
  const value = Deno.env.get("CLAUDE_ENV_FILE");
  assert(value, "CLAUDE_ENV_FILE is only set in `SessionStart` hooks.");
  logger.debug`CLAUDE_ENV_FILE = ${value}`;
  return value;
};

/** Returns path to CLAUDE_ENV_FILE. Only available in SessionStart hooks. */
export const logFile = () => {
  const logger = getLogger().getChild(["env", "logFile"]);

  logger.debug("Retrieving HOME");
  const homeDir = Deno.env.get("HOME");

  let result: string;
  if (homeDir) {
    result = path.join(homeDir, ".claude", "hooks.log");
  } else {
    result = path.join("/tmp", "claude", "hooks.log");
  }

  Deno.mkdirSync(path.dirname(result), { recursive: true });

  logger.debug("Returing log file path: {*}", { result });
  return result;
};

/**
 * Persist an environment variable to {@link CLAUDE_ENV_FILE}.
 *
 * Makes the environment variable available in all subsequent bash commands
 * executed by Claude Code during the session.
 */
export const persistEnvVar = async (
  name: string,
  value: string,
): Promise<void> => {
  const logger = getLogger().getChild(["env", "persistEnvVar"]).with({ name });

  logger.debug("Validating env var name: {name}");

  // Validate environment variable name per POSIX spec
  // Must start with letter or underscore, followed by letters, digits, or underscores
  const parsedName = z
    .string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .describe("Environment variable name")
    .parse(name);

  // Escape value for safe use in single-quoted shell strings
  // Single quotes are literal in bash - only need to escape single quotes themselves
  // Replace ' with '\'' (end quote, escaped quote, start quote)
  const escapedValue = value.replace(/'/g, "'\\''");

  if (escapedValue.length === 0) {
    logger.warn("Empty value provided for {name}");
  }

  const file = claudeEnvFile();
  const encoder = new TextEncoder();
  const line = encoder.encode(`export ${parsedName}='${escapedValue}'\n`);

  logger.debug("Persisting {name} (value of length {len}) to {file}", {
    file,
    len: escapedValue.length,
  });

  await Deno.writeFile(file, line, { append: true, create: true });
  logger.debug("{name} written to {file}", { file });
};
