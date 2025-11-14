/** Tool-specific schemas to refine types in PreToolUse and PostToolUse hooks.
 */
import { z } from "zod";

const preToolInputs = {
  read: z.object({
    type: z.literal("Read"),
    tool_name: z.literal("Read"),
    tool_input: z.object({
      file_path: z.string(),
      offset: z.number().int().nonnegative().optional(),
      limit: z.number().int().nonnegative().optional(),
    }),
  }),

  write: z.object({
    type: z.literal("Write"),
    tool_name: z.literal("Write"),
    tool_input: z.object({
      file_path: z.string(),
      content: z.string(),
    }),
  }),

  edit: z.object({
    type: z.literal("Edit"),
    tool_name: z.literal("Edit"),
    tool_input: z.object({
      file_path: z.string(),
      old_string: z.string(),
      new_string: z.string(),
      replace_all: z.boolean().optional(),
    }),
  }),

  glob: z.object({
    type: z.literal("Glob"),
    tool_name: z.literal("Glob"),
    tool_input: z.object({
      pattern: z.string(),
      path: z.string().optional(),
    }),
  }),

  notebookEdit: z.object({
    type: z.literal("NotebookEdit"),
    tool_name: z.literal("NotebookEdit"),
    tool_input: z.object({
      notebook_path: z.string(),
      new_source: z.string(),
      cell_id: z.string().optional(),
      cell_type: z.enum(["code", "markdown"]).optional(),
      edit_mode: z.enum(["replace", "insert", "delete"]).optional(),
    }),
  }),

  bash: z.object({
    type: z.literal("Bash"),
    tool_name: z.literal("Bash"),
    tool_input: z.object({
      command: z.string(),
      description: z.string().optional(),
      timeout: z.number().int().nonnegative().optional(),
      run_in_background: z.boolean().optional(),
      dangerouslyDisableSandbox: z.boolean().optional(),
    }),
  }),

  grep: z.object({
    type: z.literal("Grep"),
    tool_name: z.literal("Grep"),
    tool_input: z.object({
      pattern: z.string(),
      path: z.string().optional(),
      output_mode: z
        .enum(["content", "files_with_matches", "count"])
        .optional(),
      glob: z.string().optional(),
      type: z.string().optional(),
      "-i": z.boolean().optional(),
      "-n": z.boolean().optional(),
      "-A": z.number().int().nonnegative().optional(),
      "-B": z.number().int().nonnegative().optional(),
      "-C": z.number().int().nonnegative().optional(),
      multiline: z.boolean().optional(),
      head_limit: z.number().int().nonnegative().optional(),
    }),
  }),

  task: z.object({
    type: z.literal("Task"),
    tool_name: z.literal("Task"),
    tool_input: z.object({
      description: z.string(),
      prompt: z.string(),
      subagent_type: z.string(),
      model: z.enum(["sonnet", "opus", "haiku"]).optional(),
      resume: z.string().optional(),
    }),
  }),

  /** Fallback for unknown tools in PreToolUse */
  unknown: z.object({
    type: z.literal("Other"),

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
export const preTool = z.preprocess(
  // deno-lint-ignore no-explicit-any
  (it: any) => {
    if (typeof it !== "object") {
      return it;
    }

    if (Object.keys(it ?? {}).length === 0) {
      return it;
    }

    // Map known tool names to their types, fallback to "Other"
    const knownTools = [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "NotebookEdit",
      "Bash",
      "Grep",
      "Task",
    ];
    it.type = knownTools.includes(it.tool_name) ? it.tool_name : "Other";
    return it;
  },
  z.discriminatedUnion("type", [
    preToolInputs.read,
    preToolInputs.write,
    preToolInputs.edit,
    preToolInputs.glob,
    preToolInputs.notebookEdit,
    preToolInputs.bash,
    preToolInputs.grep,
    preToolInputs.task,
    preToolInputs.unknown,
  ]),
);

/* Tool-specific input schemas for PostToolUse */
const postToolInputs = {
  read: z.object({
    type: z.literal("Read"),
    tool_name: z.literal("Read"),
    tool_input: z.object({
      file_path: z.string(),
      offset: z.number().int().nonnegative().optional(),
      limit: z.number().int().nonnegative().optional(),
    }),
    tool_response: z.object({
      type: z.literal("text"),
      file: z.object({
        filePath: z.string(),
        content: z.string(),
        numLines: z.number().int().nonnegative(),
        startLine: z.number().int().nonnegative(),
        totalLines: z.number().int().nonnegative(),
      }),
    }),
  }),

  write: z.object({
    type: z.literal("Write"),
    tool_name: z.literal("Write"),
    tool_input: z.object({
      file_path: z.string(),
      content: z.string(),
    }),
    tool_response: z.record(z.string(), z.unknown()),
  }),

  edit: z.object({
    type: z.literal("Edit"),
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
    type: z.literal("Glob"),
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
    type: z.literal("NotebookEdit"),
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

  bash: z.object({
    type: z.literal("Bash"),
    tool_name: z.literal("Bash"),
    tool_input: z.object({
      command: z.string(),
      description: z.string().optional(),
      timeout: z.number().int().nonnegative().optional(),
      run_in_background: z.boolean().optional(),
      dangerouslyDisableSandbox: z.boolean().optional(),
    }),
    tool_response: z.object({
      stdout: z.string(),
      stderr: z.string(),
      interrupted: z.boolean(),
      isImage: z.boolean(),
    }),
  }),

  grep: z.object({
    type: z.literal("Grep"),
    tool_name: z.literal("Grep"),
    tool_input: z.object({
      pattern: z.string(),
      path: z.string().optional(),
      output_mode: z
        .enum(["content", "files_with_matches", "count"])
        .optional(),
      glob: z.string().optional(),
      type: z.string().optional(),
      "-i": z.boolean().optional(),
      "-n": z.boolean().optional(),
      "-A": z.number().int().nonnegative().optional(),
      "-B": z.number().int().nonnegative().optional(),
      "-C": z.number().int().nonnegative().optional(),
      multiline: z.boolean().optional(),
      head_limit: z.number().int().nonnegative().optional(),
    }),
    tool_response: z.union([
      z.object({ files: z.array(z.string()) }),
      z.object({ content: z.string() }),
      z.record(z.string(), z.unknown()),
    ]),
  }),

  task: z.object({
    type: z.literal("Task"),
    tool_name: z.literal("Task"),
    tool_input: z.object({
      description: z.string(),
      prompt: z.string(),
      subagent_type: z.string(),
      model: z.enum(["sonnet", "opus", "haiku"]).optional(),
      resume: z.string().optional(),
    }),
    tool_response: z.object({
      result: z.string(),
    }),
  }),

  /** Fallback for unknown tools in PostToolUse */
  unknown: z.object({
    type: z.literal("Other"),
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
export const postTool = z.preprocess(
  // deno-lint-ignore no-explicit-any
  (it: any) => {
    if (typeof it !== "object") {
      return it;
    }

    if (Object.keys(it ?? {}).length === 0) {
      return it;
    }

    // Map known tool names to their types, fallback to "Other"
    const knownTools = [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "NotebookEdit",
      "Bash",
      "Grep",
      "Task",
    ];
    it.type = knownTools.includes(it.tool_name) ? it.tool_name : "Other";
    return it;
  },
  z.discriminatedUnion("type", [
    postToolInputs.read,
    postToolInputs.write,
    postToolInputs.edit,
    postToolInputs.glob,
    postToolInputs.notebookEdit,
    postToolInputs.bash,
    postToolInputs.grep,
    postToolInputs.task,
    postToolInputs.unknown,
  ]),
);
