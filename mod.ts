/** This module provides type-safe wrapper functions for constructing hooks.

    Documentation: https://code.claude.com/docs/en/hooks
 */
import * as schemas from "./schemas/hooks.ts";
import { defineHook } from "./define-hook.ts";
import { claudeEnvFile } from "./env.ts";

/** Runs after Claude creates tool parameters and before processing the tool
    call. The result determines whether the tool call is allowed to proceed.

    stdout is shown in the Ctrl-R transcript.
 */
export const preToolUse = defineHook(
  schemas.preToolUseInput,
  schemas.preToolUseOutput,
);

/** Runs immediately after a tool completes successfully. The result provides
    feedback to Claude after tool execution.

    stdout is shown in the Ctrl-R transcript.
 */
export const postToolUse = defineHook(
  schemas.postToolUseInput,
  schemas.postToolUseOutput,
);

/** Runs when Claude Code sends notifications.

    Notifications are sent when:

    1. Claude needs your permission to use a tool. Example: "Claude needs your
       permission to use Bash"

    2. The prompt input has been idle for at least 60 seconds. "Claude is
       waiting for your input"

    stdout is only shown when Claude is run with `--debug`.
 */
export const notification = defineHook(
  schemas.notificationInput,
  schemas.notificationOutput,
);

/** Runs when the user submits a prompt, before Claude processes it.

    Allows you to add additional context based on the prompt/conversation,
    validate prompts, or block certain types of prompts.

    If blocked, the submitted prompt is erased from the context.

    stdout is added as context for Claude.
 */
export const userPromptSubmit = defineHook(
  schemas.userPromptSubmitInput,
  schemas.userPromptSubmitOutput,
);

/** A general-purpose hook that can be used for any event.
 */
export const generic = defineHook(schemas.genericInput, schemas.genericOutput);

/** Runs when the main Claude Code agent has finished responding. The output
    controls whether Claude must continue.

    Does not run if the stoppage occurred due to a user interrupt.

    stdout is shown in the Ctrl-R transcript.
 */
export const stop = defineHook(schemas.stopInput, schemas.stopOutput);

/** Runs when a Claude Code subagent (Task tool call) has finished responding.
    The output controls whether Claude must continue.

    It is not documented whether this is run when a user interrupts a subagent.

    stdout is shown in the Ctrl-R transcript.
 */
export const subagentStop = defineHook(
  schemas.subagentStopInput,
  schemas.subagentStopOutput,
);

/** Runs before Claude Code is about to run a compact operation.

    Compaction may be initiated by the user via the `/compact` command, or it
    may be initiated automatically by Claude Code when context limits are
    reached.
 */
export const preCompact = defineHook(
  schemas.preCompactInput,
  schemas.preCompactOutput,
);

/** Runs when Claude Code starts a new session or resumes an existing session
    (which currently does start a new session under the hood).

    Useful for loading in development context like existing issues or recent
    changes to your codebase, installing dependencies, or setting up environment
    variables.

    SessionStart hooks have access to the CLAUDE_ENV_FILE environment variable,
    which provides a file path where you can persist environment variables for
    subsequent bash commands.

    Any variables written to this file will be available in all subsequent bash
    commands that Claude Code executes during the session.

    stdout is added as context for Claude.
 */
export const sessionStart = defineHook(
  schemas.sessionStartInput,
  schemas.sessionStartOutput,
);

/** Persist an environment variable to `CLAUDE_ENV_FILE`, setting the
    environment variable in subsequent bash commands.

    Note that using this requires --allow-env=

    Only available in `SessionStart` hooks.
 */
export const persistEnvVar = async (name: string, value: string) => {
  const file = claudeEnvFile();
  const encoder = new TextEncoder();

  const escapedValue = value.replace(/[']/g, "\\'");
  const line = encoder.encode(`export ${name}='${escapedValue}'\n`);

  await Deno.writeFile(file, line, { append: true, create: true });
};

/** Runs when a Claude Code session ends. Useful for cleanup tasks, logging
    session statistics, or saving session state.

    stdout is only shown when Claude is run with `--debug`.
 */
export const sessionEnd = defineHook(
  schemas.sessionEndInput,
  schemas.sessionEndOutput,
);
