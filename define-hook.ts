import { assert } from "@std/assert/assert";
import { concat } from "@std/bytes/concat";
import { z } from "zod";

import { stdinMaxBufLen } from "./env.ts";

/** A hook handler function, taking the validated hook input, doing work, and
 * then returning a value of the output structure for the hook type for claude
 * to interpret.
 */
export type HookDef<Input, Output> = (
  input: HookFn<Input, Output>,
) => Promise<void>;

type HookFn<Input, Output> = (
  _: z.output<Input>,
) => PromiseOrImmediate<void | z.input<Output>>;

type PromiseOrImmediate<T> = T | Promise<T>;

/** Define a hook function that reads JSON from stdin, validates with the given
    Zod schema, then delegates to a given implementation function. The
    implementation must return undefined or a JSON payload of the given type;
    which will be validated.
 */
export const defineHook =
  <In extends z.ZodType, Out extends z.ZodType>(
    inputSchema: In,
    outputSchema: Out,
  ): HookDef<In, Out> =>
  async (fn) => {
    const stdin = await readStdin();

    let json;
    try {
      json = JSON.parse(stdin);
    } catch (_) {
      console.error("stdin was not valid JSON");
      console.error({ rawHookInput: stdin });
      Deno.exit(1);
    }

    const input = await inputSchema.parseAsync(json).catch((cause) => {
      const errorMessage =
        cause instanceof z.ZodError
          ? z.prettifyError(cause)
          : (cause as Error).message;

      console.error(`Input validation failed.

Input:
${stdin}

Errors:
${errorMessage}`);

      Deno.exit(1);
    });

    console.error({ parsedHookInput: input });

    const value = await Promise.resolve(fn(input));

    const result = await outputSchema
      .optional()
      .parseAsync(value)
      .catch((cause) => {
        const errorMessage =
          cause instanceof z.ZodError
            ? z.prettifyError(cause)
            : (cause as Error).message;

        console.error(
          `Output validation failed.

Output:
${JSON.stringify(value)}

Errors:
${errorMessage}`,
        );
        Deno.exit(1);
      });

    console.error({ parsedHookResult: result });

    if (result !== undefined) {
      console.log(JSON.stringify(result));
    }
  };

const readStdin = async (): Promise<string> => {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  const bufLimit = stdinMaxBufLen();

  for await (const chunk of Deno.stdin.readable) {
    totalBytes += chunk.byteLength;
    if (totalBytes > bufLimit) {
      throw new Error(
        `stdin exceeded maximum buffer size of ${bufLimit} bytes`,
      );
    }
    chunks.push(chunk);
  }

  assert(totalBytes > 0, "No data was sent over stdin");

  return new TextDecoder().decode(concat(chunks)).trim();
};
