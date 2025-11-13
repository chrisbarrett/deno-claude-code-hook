/**
 * Type-safe wrapper functions for constructing Claude Code hooks.
 *
 * This library uses Zod schemas for runtime validation of hook inputs and outputs,
 * ensuring type safety for all Claude Code hook events.
 *
 * @example Basic usage
 * ```typescript
 * import { sessionStart } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * sessionStart(async (input) => {
 *   console.log("Session started in:", input.workingDirectory);
 *
 *   return {
 *     hookSpecificOutput: {
 *       hookEventName: "SessionStart",
 *       additionalContext: "Custom context for Claude",
 *     },
 *   };
 * });
 * ```
 *
 * ## Environment Variables
 *
 * ### CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN
 *
 * Controls the maximum buffer size for stdin reads (default: 10 MiB).
 *
 * **Example:**
 * ```bash
 * export CLAUDE_CODE_HOOK_STDIN_MAX_BUF_LEN=20971520  # 20 MiB
 * ```
 *
 * ### CLAUDE_ENV_FILE
 *
 * Available only in `SessionStart` hooks. Path to a file where environment
 * variables can be persisted for subsequent bash commands.
 *
 * Use the {@link persistEnvVar} helper to write to this file:
 *
 * ```typescript
 * import { persistEnvVar, sessionStart } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * sessionStart(async (input) => {
 *   await persistEnvVar("MY_API_KEY", "secret-value");
 *   // MY_API_KEY now available in all subsequent bash commands
 * });
 * ```
 *
 * ## Permission Requirements
 *
 * Hooks require explicit Deno permissions:
 *
 * - `--allow-read` - stdin operations (always required)
 * - `--allow-write` - file operations (e.g., {@link persistEnvVar})
 * - `--allow-env` - environment variable access
 *
 * The library gracefully handles missing permissions by returning defaults.
 *
 * @module
 * @see {@link https://code.claude.com/docs/en/hooks | Claude Code Hooks Documentation}
 */
import { z } from "zod";
import * as schemas from "./schemas/hooks.ts";
import { defineHook } from "./define-hook.ts";
import { claudeEnvFile } from "./env.ts";

/**
 * Runs after Claude creates tool parameters and before processing the tool call.
 *
 * The result determines whether the tool call is allowed to proceed.
 * stdout is shown in the Ctrl-R transcript.
 *
 * @example Block specific tools
 * ```typescript
 * import { preToolUse } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * preToolUse(async (input) => {
 *   const blockedTools = ["Write", "Edit"];
 *
 *   if (blockedTools.includes(input.tool.tool_name)) {
 *     return {
 *       hookSpecificOutput: {
 *         hookEventName: "PreToolUse",
 *         shouldProceed: false,
 *         blockedMessage: `Tool ${input.tool.tool_name} not allowed in production`,
 *       },
 *     };
 *   }
 * });
 * ```
 *
 * @example Validate file paths
 * ```typescript
 * import { preToolUse } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * preToolUse(async (input) => {
 *   if (input.tool.tool_name === "Read") {
 *     const filePath = input.tool.tool_input.file_path;
 *
 *     if (filePath.includes("secrets")) {
 *       return {
 *         hookSpecificOutput: {
 *           hookEventName: "PreToolUse",
 *           shouldProceed: false,
 *           blockedMessage: "Cannot read files in secrets directory",
 *         },
 *       };
 *     }
 *   }
 * });
 * ```
 *
 * @example Add context before tool execution
 * ```typescript
 * import { preToolUse } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * preToolUse(async (input) => {
 *   if (input.tool.tool_name === "Bash") {
 *     return {
 *       hookSpecificOutput: {
 *         hookEventName: "PreToolUse",
 *         additionalContext: "Running in staging environment",
 *       },
 *     };
 *   }
 * });
 * ```
 */
export const preToolUse = defineHook(
  schemas.preToolUseInput,
  schemas.preToolUseOutput,
);

/**
 * Runs immediately after a tool completes successfully.
 *
 * The result provides feedback to Claude after tool execution.
 * stdout is shown in the Ctrl-R transcript.
 *
 * @example Check bash command exit codes
 * ```typescript
 * import { postToolUse } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * postToolUse(async (input) => {
 *   if (input.tool.tool_name === "Bash") {
 *     const exitCode = input.tool.tool_response.exit_code;
 *
 *     if (exitCode !== 0) {
 *       return {
 *         hookSpecificOutput: {
 *           hookEventName: "PostToolUse",
 *           additionalContext: `Command failed with exit code ${exitCode}`,
 *         },
 *       };
 *     }
 *   }
 * });
 * ```
 *
 * @example Log file modifications
 * ```typescript
 * import { postToolUse } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * postToolUse(async (input) => {
 *   if (input.tool.tool_name === "Write" || input.tool.tool_name === "Edit") {
 *     const filePath = input.tool.tool_input.file_path;
 *     console.log(`Modified: ${filePath}`);
 *   }
 * });
 * ```
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

/**
 * Runs when the user submits a prompt, before Claude processes it.
 *
 * Allows you to add additional context based on the prompt/conversation,
 * validate prompts, or block certain types of prompts.
 *
 * If blocked, the submitted prompt is erased from the context.
 * stdout is added as context for Claude.
 *
 * @example Add dynamic context based on working directory
 * ```typescript
 * import { userPromptSubmit } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * userPromptSubmit(async (input) => {
 *   const isTestDir = input.workingDirectory.includes("/tests/");
 *
 *   if (isTestDir) {
 *     return {
 *       hookSpecificOutput: {
 *         hookEventName: "UserPromptSubmit",
 *         additionalContext: "You are working in the tests directory. Prioritize test-related suggestions.",
 *       },
 *     };
 *   }
 * });
 * ```
 *
 * @example Block prompts containing sensitive patterns
 * ```typescript
 * import { userPromptSubmit } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * userPromptSubmit(async (input) => {
 *   const prompt = input.prompt.toLowerCase();
 *
 *   if (prompt.includes("delete production") || prompt.includes("drop database")) {
 *     return {
 *       hookSpecificOutput: {
 *         hookEventName: "UserPromptSubmit",
 *         shouldProceed: false,
 *         blockedMessage: "Dangerous operations blocked in production environment",
 *       },
 *     };
 *   }
 * });
 * ```
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

/**
 * Runs when Claude Code starts a new session or resumes an existing session.
 *
 * Useful for loading development context like existing issues or recent changes,
 * installing dependencies, or setting up environment variables.
 *
 * SessionStart hooks have access to {@link CLAUDE_ENV_FILE}, which provides a
 * file path where you can persist environment variables for subsequent bash commands.
 *
 * stdout is added as context for Claude.
 *
 * @example Load git context
 * ```typescript
 * import { sessionStart } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * sessionStart(async (input) => {
 *   const decoder = new TextDecoder();
 *   const gitBranch = new Deno.Command("git", {
 *     args: ["branch", "--show-current"],
 *     cwd: input.workingDirectory,
 *   });
 *   const { stdout } = await gitBranch.output();
 *   const branch = decoder.decode(stdout).trim();
 *
 *   return {
 *     hookSpecificOutput: {
 *       hookEventName: "SessionStart",
 *       additionalContext: `Current git branch: ${branch}`,
 *     },
 *   };
 * });
 * ```
 *
 * @example Set environment variables for bash commands
 * ```typescript
 * import { persistEnvVar, sessionStart } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * sessionStart(async (input) => {
 *   await persistEnvVar("NODE_ENV", "development");
 *   await persistEnvVar("API_URL", "https://staging.example.com");
 *
 *   return {
 *     hookSpecificOutput: {
 *       hookEventName: "SessionStart",
 *       additionalContext: "Environment configured for staging",
 *     },
 *   };
 * });
 * ```
 *
 * @example Load issue tracking context
 * ```typescript
 * import { sessionStart } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * sessionStart(async (input) => {
 *   // Fetch open issues from tracking system
 *   const response = await fetch("https://api.example.com/issues?status=open");
 *   const issues = await response.json();
 *
 *   const issueList = issues.map((i) => `- ${i.id}: ${i.title}`).join("\n");
 *
 *   return {
 *     hookSpecificOutput: {
 *       hookEventName: "SessionStart",
 *       additionalContext: `Open issues:\n${issueList}`,
 *     },
 *   };
 * });
 * ```
 */
export const sessionStart = defineHook(
  schemas.sessionStartInput,
  schemas.sessionStartOutput,
);

/**
 * Persist an environment variable to {@link CLAUDE_ENV_FILE}.
 *
 * Makes the environment variable available in all subsequent bash commands
 * executed by Claude Code during the session.
 *
 * **Permissions required:**
 * - `--allow-env` - to read CLAUDE_ENV_FILE path
 * - `--allow-write` - to write to the environment file
 *
 * **Only available in `SessionStart` hooks.**
 *
 * @param name - Environment variable name (must match POSIX: [a-zA-Z_][a-zA-Z0-9_]*)
 * @param value - Environment variable value (automatically escaped for shell safety)
 *
 * @throws {Error} If name is invalid or CLAUDE_ENV_FILE is not set
 *
 * @example Basic usage
 * ```typescript
 * import { persistEnvVar, sessionStart } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * sessionStart(async (input) => {
 *   await persistEnvVar("DATABASE_URL", "postgresql://localhost/mydb");
 *   await persistEnvVar("LOG_LEVEL", "debug");
 * });
 * ```
 *
 * @example Conditional environment setup
 * ```typescript
 * import { persistEnvVar, sessionStart } from "jsr:@chrisbarrett/claude-code-hook";
 *
 * sessionStart(async (input) => {
 *   const isProduction = input.workingDirectory.includes("/production/");
 *
 *   if (isProduction) {
 *     await persistEnvVar("NODE_ENV", "production");
 *     await persistEnvVar("API_URL", "https://api.example.com");
 *   } else {
 *     await persistEnvVar("NODE_ENV", "development");
 *     await persistEnvVar("API_URL", "https://staging.example.com");
 *   }
 * });
 * ```
 */
export const persistEnvVar = async (
  name: string,
  value: string,
): Promise<void> => {
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

  const file = claudeEnvFile();
  const encoder = new TextEncoder();
  const line = encoder.encode(`export ${parsedName}='${escapedValue}'\n`);

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
