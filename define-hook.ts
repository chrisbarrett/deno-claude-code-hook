// deno-lint-ignore-file no-explicit-any
import type { Logger } from "@logtape/logtape";
import { assert } from "@std/assert";
import { concat } from "@std/bytes";
import { z } from "zod";

import { stdinMaxBufLen } from "./env.ts";
import { configureLogging, getLogger } from "./logging.ts";

/** A hook handler function, taking the validated hook input, doing work, and
 * then returning a value of the output structure for the hook type for claude
 * to interpret.
 */
export type HookDef<Input, Output, ExtraCtx = unknown> = (
  input: HookFn<Input, Output, ExtraCtx>,
) => Promise<void>;

type HookFn<Input, Output, ExtraCtx> = (
  _: z.output<Input>,
  ctx: Context & ExtraCtx,
) => PromiseOrImmediate<void | z.input<Output>>;

type PromiseOrImmediate<T> = T | Promise<T>;

/** Additional stuff available within a hook implementation. */
export type Context = {
  /** A child logger that will output to stderr and the log file.
   *
   * The log file can be set via `CLAUDE_CODE_HOOK_LOG_FILE`. If unset, logs are
   * written to `~/.claude/hooks.log` (or `/tmp/claude/hooks.log` if `HOME` is
   * not set).
   */
  logger: Logger;
};

/** Define a hook function that reads JSON from stdin, validates with the given
    Zod schema, then delegates to a given implementation function. The
    implementation must return undefined or a JSON payload of the given type;
    which will be validated.
 */
export const defineHook =
  <
    In extends z.ZodType,
    Out extends z.ZodType,
    CtxExtra extends Record<string, any>,
  >(
    inputSchema: In,
    outputSchema: Out,
    extraContext: CtxExtra,
  ): HookDef<In, Out, CtxExtra> =>
  async (fn) => {
    await configureLogging();

    const logger = getLogger("main");
    logger.info`Execution started`;

    try {
      const stdin = await readStdin();

      let json;
      try {
        json = JSON.parse(stdin);
      } catch (cause) {
        logger.error("stdin was not valid JSON: {*}", { stdin });
        throw new Deno.errors.InvalidData("stdin was not valid JSON", {
          cause,
        });
      }
      const input = await inputSchema.parseAsync(json).catch((cause) => {
        const errorMessage =
          cause instanceof z.ZodError
            ? z.prettifyError(cause)
            : (cause as Error).message;

        logger.error(
          "Input validation failed:\n{errorMessage}\n\nValue: {value}",
          {
            stdin,
            errorMessage,
          },
        );

        throw new Deno.errors.InvalidData(
          `Input validation failed:\n${errorMessage}`,
          {
            cause,
          },
        );
      });

      logger.debug("Input parsed successfully. {*}", { input });

      const value = await Promise.resolve(
        fn(input, {
          logger: logger.getChild("handler"),
          ...extraContext,
        }),
      );

      const result = await outputSchema
        .optional()
        .parseAsync(value)
        .catch((cause) => {
          const errorMessage =
            cause instanceof z.ZodError
              ? z.prettifyError(cause)
              : (cause as Error).message;

          logger.error(
            "Output validation failed:\n{errorMessage}\n\nValue: {value}",
            { value, errorMessage },
          );

          throw new Deno.errors.InvalidData("Output validation failed", {
            cause,
          });
        });

      if (result === undefined) {
        logger.info`Empty output from handler`;
      } else {
        logger.info("Sending output to Claude Code: {*}", { result });

        console.log(JSON.stringify(result));
      }

      logger.info("Execution complete.");
    } catch (cause: any) {
      logger.error(cause.message, { cause });
      console.error(cause);
      Deno.exit(1);
    }
  };

const readStdin = async (): Promise<string> => {
  const logger = getLogger("readStdin");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  const bufLimit = stdinMaxBufLen();
  logger.debug("Reading stdin. {*}", { bufLimit });

  for await (const chunk of Deno.stdin.readable) {
    totalBytes += chunk.byteLength;
    if (totalBytes > bufLimit) {
      throw new Deno.errors.InvalidData(
        `stdin exceeded maximum buffer size of ${bufLimit} bytes.`,
      );
    }
    chunks.push(chunk);
  }

  assert(totalBytes > 0, "No data was sent over stdin");
  const result = new TextDecoder().decode(concat(chunks)).trim();

  logger.debug("stdin read: {*}", { totalBytes, stdin: result });
  return result;
};
