/** Tool-specific schemas to refine types in PreToolUse and PostToolUse hooks.
 */
import { z } from "zod";

/** Summons a hacky discriminator from the netherworld to help type inference
    for `z.discriminatedUnion`
 */
const tag = <T extends string>(s: T): z.ZodLiteral<T> =>
  z
    .never()
    .optional()
    // deno-lint-ignore no-explicit-any
    .default(s as any) as any;

const preToolInputs = {
  read: z.object({
    type: tag("Read"),
    tool_name: z.literal("Read"),
    tool_input: z.object({
      file_path: z.string(),
      offset: z.number().optional(),
      limit: z.number().optional(),
    }),
  }),

  write: z.object({
    type: tag("Write"),
    tool_name: z.literal("Write"),
    tool_input: z.object({
      file_path: z.string(),
      content: z.string(),
    }),
  }),

  edit: z.object({
    type: tag("Edit"),
    tool_name: z.literal("Edit"),
    tool_input: z.object({
      file_path: z.string(),
      old_string: z.string(),
      new_string: z.string(),
      replace_all: z.boolean().optional(),
    }),
  }),

  glob: z.object({
    type: tag("Glob"),
    tool_name: z.literal("Glob"),
    tool_input: z.object({
      pattern: z.string(),
      path: z.string().optional(),
    }),
  }),

  notebookEdit: z.object({
    type: tag("NotebookEdit"),
    tool_name: z.literal("NotebookEdit"),
    tool_input: z.object({
      notebook_path: z.string(),
      new_source: z.string(),
      cell_id: z.string().optional(),
      cell_type: z.enum(["code", "markdown"]).optional(),
      edit_mode: z.enum(["replace", "insert", "delete"]).optional(),
    }),
  }),

  /** Fallback for unknown tools in PreToolUse */
  unknown: z.object({
    type: tag("Other"),

    /** Name of the tool.

      MCP tools follow the following naming pattern:

      mcp__<server>__<tool>

      @example "mcp__github__search_repositories"
   */
    tool_name: z.string(),

    /** Input arguments for the tool call.

      The exact schema depends on the tool.
   */
    tool_input: z.record(z.string(), z.unknown()),
  }),
};

/** A tool input in a PreToolUse hook.

    Refine `type` using an if or switch statement to get additional type-safety.
 */
export const preTool = z.discriminatedUnion("type", [
  preToolInputs.read,
  preToolInputs.write,
  preToolInputs.edit,
  preToolInputs.glob,
  preToolInputs.notebookEdit,
  preToolInputs.unknown,
]);

/* Tool-specific input schemas for PostToolUse */
const postToolInputs = {
  read: z.object({
    type: tag("Read"),
    tool_name: z.literal("Read"),
    tool_input: z.object({
      file_path: z.string(),
      offset: z.number().optional(),
      limit: z.number().optional(),
    }),
    tool_response: z.object({
      content: z.string(),
    }),
  }),

  write: z.object({
    type: tag("Write"),
    tool_name: z.literal("Write"),
    tool_input: z.object({
      file_path: z.string(),
      content: z.string(),
    }),
    tool_response: z.record(z.string(), z.unknown()),
  }),

  edit: z.object({
    type: tag("Edit"),
    tool_name: z.literal("Edit"),
    tool_input: z.object({
      file_path: z.string(),
      old_string: z.string(),
      new_string: z.string(),
      replace_all: z.boolean().optional(),
    }),
    tool_response: z.record(z.string(), z.unknown()),
  }),

  glob: z.object({
    type: tag("Glob"),
    tool_name: z.literal("Glob"),
    tool_input: z.object({
      pattern: z.string(),
      path: z.string().optional(),
    }),
    tool_response: z.object({
      files: z.array(z.string()),
    }),
  }),

  notebookEdit: z.object({
    type: tag("NotebookEdit"),
    tool_name: z.literal("NotebookEdit"),
    tool_input: z.object({
      notebook_path: z.string(),
      new_source: z.string(),
      cell_id: z.string().optional(),
      cell_type: z.enum(["code", "markdown"]).optional(),
      edit_mode: z.enum(["replace", "insert", "delete"]).optional(),
    }),
    tool_response: z.record(z.string(), z.unknown()),
  }),

  /** Fallback for unknown tools in PostToolUse */
  unknown: z.object({
    type: tag("Other"),
    tool_name: z.string(),

    /** Input arguments for the tool call.

      The exact schema depends on the tool.
   */
    tool_input: z.record(z.string(), z.unknown()),

    /** Output structure for the tool call.

      The exact schema depends on the specific tool.
   */
    tool_response: z.record(z.string(), z.unknown()),
  }),
};

/** A tool input in a PostToolUse hook.

    Refine `type` using an if or switch statement to get additional type-safety.
 */
export const postTool = z.discriminatedUnion("type", [
  postToolInputs.read,
  postToolInputs.write,
  postToolInputs.edit,
  postToolInputs.glob,
  postToolInputs.notebookEdit,
  postToolInputs.unknown,
]);
