import { assert } from "@std/assert/assert";
import { concat } from "@std/bytes/concat";
import { z } from "zod";

import { stdinMaxBufLen } from "./env.ts";

type PromiseOrImmediate<T> = T | Promise<T>;

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

/** Define a hook function that reads JSON from stdin, validates with the given
    Zod schema, then delegates to a given implementation function. The
    implementation must return undefined or a JSON payload of the given type;
    which will be validated.
 */
export const defineHook = <Input extends z.ZodType, Output extends z.ZodType>(
  inputSchema: Input,
  outputSchema: Output,
) =>
async (
  fn: (_: z.output<Input>) => PromiseOrImmediate<void | z.input<Output>>,
): Promise<void> => {
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
    const errorMessage = cause instanceof z.ZodError
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
      const errorMessage = cause instanceof z.ZodError
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
