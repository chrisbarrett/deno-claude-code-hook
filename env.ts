import { assert } from "@std/assert/assert";
import { z } from "zod";

type GetEnv<T> = {
  variable: string;
  schema: z.ZodType<T>;
  default: T;
};

const getEnv = <T>(input: GetEnv<T>): T => {
  const { state } = Deno.permissions.querySync({
    name: "env",
    variable: input.variable,
  });

  if (state !== "granted") {
    return input.default;
  }

  const value = Deno.env.get(input.variable);
  if (value === undefined) {
    return input.default;
  }

  return input.schema.parse(value);
};

/** Determine the max number of bytes we're allowed to receive from stdin.

    The default is 10 MiB unless overridden via the process env. That's
    pretty arbitrary, but if your hooks are getting piped that much data by
    Claude Code then something very sus is happening!
 */
export const stdinMaxBufLen = (): number => {
  const dflt = 10 * 1024 * 1024;
  return getEnv({
    variable: "CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN",
    default: dflt,
    schema: z.coerce.number().int().positive().catch(dflt),
  });
};

export const claudeEnvFile = () => {
  const value = Deno.env.get("CLAUDE_ENV_FILE");
  assert(value, "CLAUDE_ENV_FILE is only set in `SessionStart` hooks.");
  return value;
};
