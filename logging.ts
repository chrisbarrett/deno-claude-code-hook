import { getFileSink } from "@logtape/file";
import * as logtape from "@logtape/logtape";
import * as cache from "@std/cache";
const libCategory = "@chrisbarrett/claude-code-hook";

import { logFile } from "./env.ts";

/** Get a logger with the library category set for use in a hook. */
export const getLogger = (...categories: string[]) => {
  return logtape.getLogger([libCategory, ...categories]);
};

/** Configure structured logging to stderr & files.
 *
 *  The configuration set here will be picked up inside the hook handler
 *  implementation. It must be called before you instantiate any hook function.
 */
export const configureLogging = cache.memoize(async () => {
  const file = logFile();

  await logtape.configure({
    sinks: {
      stderr: logtape.getStreamSink(Deno.stderr.writable),
      file: getFileSink(file, {
        formatter: logtape.getTextFormatter({ level: "FULL", category: "." }),
        bufferSize: 0,
        flushInterval: 0,
      }),
    },
    loggers: [
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["stderr"],
      },
      {
        category: libCategory,
        lowestLevel: "trace",
        sinks: ["file", "stderr"],
      },
    ],
  });
});
