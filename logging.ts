import { getRotatingFileSink } from "@logtape/file";
import * as logtape from "@logtape/logtape";
const libCategory = "@chrisbarrett/claude-code-hook";

import { logFile } from "./env.ts";

/** Get a logger with the library category set for use in a hook. */
export const getLogger = (...categories: string[]) => {
  return logtape.getLogger([libCategory, ...categories]);
};

/** Options for configuring logging. */
export type LoggingOptions = {
  /** Path to the log file. Defaults to CLAUDE_LOG_FILE env var. */
  file?: string;
  /** Maximum size in bytes before rotation. Defaults to 1 MiB. */
  maxSize?: number;
  /** Maximum number of rotated files to keep. Defaults to 5. */
  maxFiles?: number;
  /** Disable stderr output. Useful for testing. Defaults to false. */
  disableStderr?: boolean;
};

/** Configure structured logging to stderr & files.
 *
 *  The configuration set here will be picked up inside the hook handler
 *  implementation. It must be called before you instantiate any hook function.
 */
export const configureLogging = async (options: LoggingOptions = {}) => {
  const {
    file = logFile(),
    maxSize = 0x400 * 0x400, // 1 MiB
    maxFiles = 5,
    disableStderr = false,
  } = options;

  const sinks: Record<string, logtape.Sink> = {
    file: getRotatingFileSink(file, {
      maxSize,
      maxFiles,
      formatter: logtape.getTextFormatter({ level: "FULL", category: "." }),
      bufferSize: 0,
      flushInterval: 0,
    }),
  };

  if (!disableStderr) {
    sinks.stderr = logtape.getStreamSink(Deno.stderr.writable);
  }

  const libSinks = disableStderr ? ["file"] : ["file", "stderr"];
  const metaSinks = disableStderr ? [] : ["stderr"];

  await logtape.configure({
    sinks,
    loggers: [
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: metaSinks,
      },
      {
        category: libCategory,
        lowestLevel: "trace",
        sinks: libSinks,
      },
    ],
  });
};
