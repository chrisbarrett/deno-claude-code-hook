/** Shared Zod schemas for Claude Code hooks

    This module provides type-safe schemas for all hook input and output
    formats.

    Documentation: https://code.claude.com/docs/en/hooks
 */

import { z } from "zod";
import { postTool, preTool } from "./tools.ts";

/** Current permission mode. */
export const permissionMode = z.enum([
  "default",
  "plan",
  "acceptEdits",
  "bypassPermissions",
]);

/** Attributes common to all input payloads.
 */
export const genericInput = z.object({
  hook_event_name: z.string(),

  /** Unique identifier for the session. */
  session_id: z.string(),

  /** Path to conversation JSON. */
  transcript_path: z.string(),

  /** The current working directory when the hook is invoked */
  cwd: z.string(),
});

/** Attributes common to all output payloads.
 */
export const genericOutput = z
  .object({
    /** Hide stdout from transcript mode.

        @default false
     */
    suppressOutput: z.boolean().optional().default(false),

    /** Optional warning message shown to the user. */
    systemMessage: z.string().optional(),
  })
  .and(
    z.discriminatedUnion("continue", [
      z.object({
        /** Stop processing after all hooks are run.

            Overrides any `"decision": "block"` output.
         */
        continue: z.literal(false),

        /** Message shown to the user when `continue` is false.

            The text is printed directly to the terminal and is not visible to
            Claude.
         */
        stopReason: z.string().optional(),
      }),
      z.object({
        /** Continue processing.
         */
        continue: z.literal(true).optional(),
      }),
    ]),
  );

export const preToolUseInput = genericInput
  .extend({
    hook_event_name: z.literal("PreToolUse"),
    /** Current permission mode. */
    permission_mode: permissionMode,
  })
  .and(preTool);

export const preToolUseOutput = genericOutput.and(
  z.object({
    hookSpecificOutput: z
      .object({
        hookEventName: z.literal("PreToolUse"),

        /** A text description shown to the user.

            Claude only sees this text when `permissionDecision` is `deny`.
         */
        permissionDecisionReason: z.string(),
      })
      .and(
        z.discriminatedUnion("permissionDecision", [
          z.object({
            /** Prevents the tool call from executing. */
            permissionDecision: z.literal("deny"),
          }),
          z.object({
            permissionDecision: z.enum([
              /** Bypasses the permission system. */
              "allow",
              /** Asks the user to confirm the tool call in the UI. */
              "ask",
            ]),

            /** Modifications to tool inputs prior to execution by Claude. */
            updatedInput: z.record(z.string(), z.any()).optional(),
          }),
        ]),
      ),
  }),
);

export const postToolUseInput = genericInput
  .extend({
    hook_event_name: z.literal("PostToolUse"),
    /** Current permission mode. */
    permission_mode: permissionMode,
  })
  .and(postTool);

export const postToolUseOutput = genericOutput.and(
  z
    .object({
      /** Additional context for Claude to consider. */
      hookSpecificOutput: z
        .object({
          hookEventName: z.literal("PostToolUse"),
          /** Additional context for Claude to consider. */
          additionalContext: z.string(),
        })
        .optional(),
    })
    .and(
      z.discriminatedUnion("decision", [
        z.object({
          decision: z.literal("block"),
          /** Explanation for decision. */
          reason: z.string(),
        }),
        z.object({
          decision: z.literal("allow").optional(),
        }),
      ]),
    ),
);

export const notificationInput = genericInput.extend({
  hook_event_name: z.literal("Notification"),

  /** Message payload intended for user display.

      @example "Task completed successfully"
   */
  message: z.string(),
});

export const notificationOutput = genericOutput;

export const userPromptSubmitInput = genericInput.extend({
  hook_event_name: z.literal("UserPromptSubmit"),
  /** Current permission mode. */
  permission_mode: permissionMode,

  /** The prompt submitted by the user. */
  prompt: z.string(),
});

export const userPromptSubmitOutput = genericOutput.and(
  z.discriminatedUnion("decision", [
    z.object({
      /** Prevents the prompt from being processed. */
      decision: z.literal("block"),

      /** Explanation for decision. It is shown to the user but not added to
          context.
       */
      reason: z.string(),
    }),
    z.object({
      decision: z.literal("allow").optional(),

      /** Additional context for Claude to consider. */
      hookSpecificOutput: z
        .object({
          hookEventName: z.literal("UserPromptSubmit"),
          /** Additional context for Claude to consider. */
          additionalContext: z.string(),
        })
        .optional(),
    }),
  ]),
);

export const stopInput = genericInput.extend({
  hook_event_name: z.literal("Stop"),
  /** Current permission mode. */
  permission_mode: permissionMode,

  /** `true` when Claude Code is already continuing as a result of a stop
       hook.

       Check this value or process the transcript to prevent Claude Code from
       running indefinitely.
   */
  stop_hook_active: z.boolean(),
});

export const stopOutput = genericOutput.and(
  z.discriminatedUnion("decision", [
    z.object({
      /** Prevent Claude from stopping. */
      decision: z.literal("block"),

      /** Tell Claude how to proceed. */
      reason: z.string(),
    }),
    z.object({
      decision: z.literal("allow").optional(),
    }),
  ]),
);

export const subagentStopInput = genericInput.extend({
  hook_event_name: z.literal("SubagentStop"),

  /** `true` when Claude Code is already continuing as a result of a stop
       hook.

       Check this value or process the transcript to prevent Claude Code
       from running indefinitely.
   */
  stop_hook_active: z.boolean(),
});

export const subagentStopOutput = genericOutput.and(
  z.discriminatedUnion("decision", [
    z.object({
      /** Prevent Claude from stopping. */
      decision: z.literal("block"),

      /** Tell Claude how to proceed. */
      reason: z.string(),
    }),
    z.object({
      decision: z.literal("allow").optional(),
    }),
  ]),
);

export const preCompactInput = genericInput
  .extend({
    hook_event_name: z.literal("PreCompact"),
  })
  .and(
    z.discriminatedUnion("trigger", [
      z.object({
        /** Invoked from auto-compact (due to full context window). */
        trigger: z.literal("auto"),
      }),
      z.object({
        /** Invoked manually via `/compact`. */
        trigger: z.literal("manual"),

        /** Arguments given to `/compact` by the user for a `manual`
            compaction.
        */
        custom_instructions: z
          .string()
          .transform((it) => (it.length === 0 ? undefined : it)),
      }),
    ]),
  );

export const preCompactOutput = genericOutput;

export const sessionStartInput = genericInput.extend({
  hook_event_name: z.literal("SessionStart"),
  source: z.enum([
    /** Invoked from startup. */
    "startup",
    /** Invoked from `--resume`, `--continue`, or `/resume`. */
    "resume",
    /** Invoked from `/clear` */
    "clear",
    /** Invoked from auto or manual compact. */
    "compact",
  ]),
});

export const sessionStartOutput = genericOutput.and(
  z.object({
    /** Additional context for Claude to consider. */
    hookSpecificOutput: z
      .object({
        hookEventName: z.literal("SessionStart"),

        /** Additional context for Claude to consider.

            Multiple hooks' `additionalContext` values are concatenated.
         */
        additionalContext: z.string(),
      })
      .optional(),
  }),
);

export const sessionEndInput = genericInput.extend({
  hook_event_name: z.literal("SessionEnd"),
  reason: z.enum([
    /** Session cleared with `/clear` command. */
    "clear",
    /** User logged out. */
    "logout",
    /** User exited while prompt input was visible. */
    "prompt_input_exit",
    /** Other exit reasons. */
    "other",
    /** Not documented, but shown in example. */
    "exit",
  ]),
});

export const sessionEndOutput = genericOutput;
