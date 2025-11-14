/** Tool-specific schemas to refine types in PreToolUse and PostToolUse hooks.
 */
import { z } from "zod";

// Shared enum schemas
//
// They are left open to extension to enable nice editor completions while still
// allowing widening future changes.

const notebookCellType = z.enum(["code", "markdown"]).or(z.string());
const notebookEditMode = z.enum(["replace", "insert", "delete"]).or(z.string());
const modelType = z.enum(["sonnet", "opus", "haiku"]).or(z.string());

const todoStatus = z
  .enum(["pending", "in_progress", "completed"])
  .or(z.string());

const grepOutputMode = z
  .enum(["content", "files_with_matches", "count"])
  .or(z.string());

const uint = z.number().int().nonnegative();

const preToolInputs = {
  read: z.object({
    type: z.literal("Read"),
    tool_name: z.literal("Read"),
    tool_input: z.object({
      file_path: z.string(),
      offset: uint.optional(),
      limit: uint.optional(),
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
      cell_type: notebookCellType.optional(),
      edit_mode: notebookEditMode.optional(),
    }),
  }),

  bash: z.object({
    type: z.literal("Bash"),
    tool_name: z.literal("Bash"),
    tool_input: z.object({
      command: z.string(),
      description: z.string().optional(),
      timeout: uint.optional(),
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
      output_mode: grepOutputMode.optional(),
      glob: z.string().optional(),
      type: z.string().optional(),
      "-i": z.boolean().optional(),
      "-n": z.boolean().optional(),
      "-A": uint.optional(),
      "-B": uint.optional(),
      "-C": uint.optional(),
      multiline: z.boolean().optional(),
      head_limit: uint.optional(),
    }),
  }),

  task: z.object({
    type: z.literal("Task"),
    tool_name: z.literal("Task"),
    tool_input: z.object({
      description: z.string(),
      prompt: z.string(),
      subagent_type: z.string(),
      model: modelType.optional(),
      resume: z.string().optional(),
    }),
  }),

  todoWrite: z.object({
    type: z.literal("TodoWrite"),
    tool_name: z.literal("TodoWrite"),
    tool_input: z.object({
      todos: z.array(
        z.object({
          content: z.string(),
          status: todoStatus,
          activeForm: z.string(),
        }),
      ),
    }),
  }),

  webFetch: z.object({
    type: z.literal("WebFetch"),
    tool_name: z.literal("WebFetch"),
    tool_input: z.object({
      url: z.string(),
      prompt: z.string(),
    }),
  }),

  webSearch: z.object({
    type: z.literal("WebSearch"),
    tool_name: z.literal("WebSearch"),
    tool_input: z.object({
      query: z.string(),
      allowed_domains: z.array(z.string()).optional(),
      blocked_domains: z.array(z.string()).optional(),
    }),
  }),

  slashCommand: z.object({
    type: z.literal("SlashCommand"),
    tool_name: z.literal("SlashCommand"),
    tool_input: z.object({
      command: z.string(),
    }),
  }),

  bashOutput: z.object({
    type: z.literal("BashOutput"),
    tool_name: z.literal("BashOutput"),
    tool_input: z.object({
      bash_id: z.string(),
      filter: z.string().optional(),
    }),
  }),

  killShell: z.object({
    type: z.literal("KillShell"),
    tool_name: z.literal("KillShell"),
    tool_input: z.object({
      shell_id: z.string(),
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
      "TodoWrite",
      "WebFetch",
      "WebSearch",
      "SlashCommand",
      "BashOutput",
      "KillShell",
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
    preToolInputs.todoWrite,
    preToolInputs.webFetch,
    preToolInputs.webSearch,
    preToolInputs.slashCommand,
    preToolInputs.bashOutput,
    preToolInputs.killShell,
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
      offset: uint.optional(),
      limit: uint.optional(),
    }),
    tool_response: z.object({
      type: z.literal("text"),
      file: z.object({
        filePath: z.string(),
        content: z.string(),
        numLines: uint,
        startLine: uint,
        totalLines: uint,
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
      filenames: z.array(z.string()),
      durationMs: uint,
      numFiles: uint,
      truncated: z.boolean(),
    }),
  }),

  notebookEdit: z.object({
    type: z.literal("NotebookEdit"),
    tool_name: z.literal("NotebookEdit"),
    tool_input: z.object({
      notebook_path: z.string(),
      new_source: z.string(),
      cell_id: z.string().optional(),
      cell_type: notebookCellType.optional(),
      edit_mode: notebookEditMode.optional(),
    }),
    tool_response: z.record(z.string(), z.unknown()),
  }),

  bash: z.object({
    type: z.literal("Bash"),
    tool_name: z.literal("Bash"),
    tool_input: z.object({
      command: z.string(),
      description: z.string().optional(),
      timeout: uint.optional(),
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
      output_mode: grepOutputMode.optional(),
      glob: z.string().optional(),
      type: z.string().optional(),
      "-i": z.boolean().optional(),
      "-n": z.boolean().optional(),
      "-A": uint.optional(),
      "-B": uint.optional(),
      "-C": uint.optional(),
      multiline: z.boolean().optional(),
      head_limit: uint.optional(),
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
      model: modelType.optional(),
      resume: z.string().optional(),
    }),
    tool_response: z.object({
      status: z.string(),
      prompt: z.string(),
      agentId: z.string(),
      content: z.array(
        z.object({
          type: z.string(),
          text: z.string(),
        }),
      ),
      totalDurationMs: uint,
      totalTokens: uint,
      totalToolUseCount: uint,
      usage: z.record(z.string(), z.unknown()),
    }),
  }),

  todoWrite: z.object({
    type: z.literal("TodoWrite"),
    tool_name: z.literal("TodoWrite"),
    tool_input: z.object({
      todos: z.array(
        z.object({
          content: z.string(),
          status: todoStatus,
          activeForm: z.string(),
        }),
      ),
    }),
    tool_response: z.object({
      oldTodos: z.array(
        z.object({
          content: z.string(),
          status: todoStatus,
          activeForm: z.string(),
        }),
      ),
      newTodos: z.array(
        z.object({
          content: z.string(),
          status: todoStatus,
          activeForm: z.string(),
        }),
      ),
    }),
  }),

  webFetch: z.object({
    type: z.literal("WebFetch"),
    tool_name: z.literal("WebFetch"),
    tool_input: z.object({
      url: z.string(),
      prompt: z.string(),
    }),
    tool_response: z.object({
      bytes: uint,
      code: uint,
      codeText: z.string(),
      result: z.string(),
      durationMs: uint,
      url: z.string(),
    }),
  }),

  webSearch: z.object({
    type: z.literal("WebSearch"),
    tool_name: z.literal("WebSearch"),
    tool_input: z.object({
      query: z.string(),
      allowed_domains: z.array(z.string()).optional(),
      blocked_domains: z.array(z.string()).optional(),
    }),
    tool_response: z.object({
      query: z.string(),
      results: z.array(z.unknown()),
      durationSeconds: z.number(),
    }),
  }),

  slashCommand: z.object({
    type: z.literal("SlashCommand"),
    tool_name: z.literal("SlashCommand"),
    tool_input: z.object({
      command: z.string(),
    }),
    tool_response: z.object({
      success: z.boolean(),
      commandName: z.string(),
    }),
  }),

  bashOutput: z.object({
    type: z.literal("BashOutput"),
    tool_name: z.literal("BashOutput"),
    tool_input: z.object({
      bash_id: z.string(),
      filter: z.string().optional(),
    }),
    tool_response: z.object({
      shellId: z.string(),
      command: z.string(),
      status: z.string(),
      exitCode: z.number().int().nullable(),
      stdout: z.string(),
      stderr: z.string(),
      stdoutLines: uint,
      stderrLines: uint,
      timestamp: z.string(),
    }),
  }),

  killShell: z.object({
    type: z.literal("KillShell"),
    tool_name: z.literal("KillShell"),
    tool_input: z.object({
      shell_id: z.string(),
    }),
    tool_response: z.object({
      message: z.string(),
      shell_id: z.string(),
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
      "TodoWrite",
      "WebFetch",
      "WebSearch",
      "SlashCommand",
      "BashOutput",
      "KillShell",
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
    postToolInputs.todoWrite,
    postToolInputs.webFetch,
    postToolInputs.webSearch,
    postToolInputs.slashCommand,
    postToolInputs.bashOutput,
    postToolInputs.killShell,
    postToolInputs.unknown,
  ]),
);
