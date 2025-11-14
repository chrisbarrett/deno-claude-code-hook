/** Tool-specific schemas to refine types in PreToolUse and PostToolUse hooks.
 */
import { z } from "zod";

// Shared enum schemas
//
// They are left open to extension to enable nice editor completions while still
// allowing widening future changes.

/** Notebook cell type: code or markdown. */
const notebookCellType = z.enum(["code", "markdown"]);

/** Notebook edit operation mode. */
const notebookEditMode = z.enum(["replace", "insert", "delete"]);

/** Claude model type for Task tool agent selection. */
const modelType = z.enum(["sonnet", "opus", "haiku"]);

/** Todo item status. */
const todoStatus = z.enum(["pending", "in_progress", "completed"]);

/** Grep output mode controlling the format of results. */
const grepOutputMode = z.enum(["content", "files_with_matches", "count"]);

/** Non-negative integer type. */
const uint = z.number().int().nonnegative();

/** An item in a todo list. */
const todoItem = z.object({
  /** Description of what needs to be done (imperative form). */
  content: z.string(),
  /** Current status of the todo item. */
  status: todoStatus,
  /** Present continuous form shown during execution. */
  activeForm: z.string(),
});

const preToolInputs = {
  read: z.object({
    type: z.literal("Read"),
    tool_name: z.literal("Read"),
    tool_input: z.object({
      /** Absolute path to the file to read. */
      file_path: z.string(),
      /** Line number to start reading from (1-indexed). */
      offset: uint.optional(),
      /** Number of lines to read. */
      limit: uint.optional(),
    }),
  }),

  write: z.object({
    type: z.literal("Write"),
    tool_name: z.literal("Write"),
    tool_input: z.object({
      /** Absolute path to the file to write. */
      file_path: z.string(),
      /** Content to write to the file. */
      content: z.string(),
    }),
  }),

  edit: z.object({
    type: z.literal("Edit"),
    tool_name: z.literal("Edit"),
    tool_input: z.object({
      /** Absolute path to the file to modify. */
      file_path: z.string(),
      /** Text to replace. */
      old_string: z.string(),
      /** Replacement text. */
      new_string: z.string(),
      /** Replace all occurrences of old_string (default: false). */
      replace_all: z.boolean().optional(),
    }),
  }),

  glob: z.object({
    type: z.literal("Glob"),
    tool_name: z.literal("Glob"),
    tool_input: z.object({
      /** Glob pattern to match files against (e.g., "**\/*.ts"). */
      pattern: z.string(),
      /** Directory to search in. Defaults to current working directory. */
      path: z.string().optional(),
    }),
  }),

  notebookEdit: z.object({
    type: z.literal("NotebookEdit"),
    tool_name: z.literal("NotebookEdit"),
    tool_input: z.object({
      /** Absolute path to the Jupyter notebook file to edit. */
      notebook_path: z.string(),
      /** New source code for the cell. */
      new_source: z.string(),
      /** Cell ID to edit. When inserting, inserts after this cell. */
      cell_id: z.string().optional(),
      /** Cell type. Defaults to current cell type; required for insert mode. */
      cell_type: notebookCellType.optional(),
      /** Edit operation mode. Defaults to "replace". */
      edit_mode: notebookEditMode.optional(),
    }),
  }),

  bash: z.object({
    type: z.literal("Bash"),
    tool_name: z.literal("Bash"),
    tool_input: z.object({
      /** Shell command to execute. */
      command: z.string(),
      /** Clear, concise description of command (5-10 words). */
      description: z.string().optional(),
      /** Timeout in milliseconds (max 600000, default: 120000). */
      timeout: uint.optional(),
      /** Execute command in background without blocking. */
      run_in_background: z.boolean().optional(),
    }),
  }),

  grep: z.object({
    type: z.literal("Grep"),
    tool_name: z.literal("Grep"),
    tool_input: z.object({
      /** Regular expression pattern to search for (ripgrep syntax). */
      pattern: z.string(),
      /** File or directory to search in. Defaults to current working directory. */
      path: z.string().optional(),
      /** Output format: "content" (matching lines), "files_with_matches" (file paths), or "count" (match counts). */
      output_mode: grepOutputMode.optional(),
      /** Glob pattern to filter files (e.g., "*.js", "*.{ts,tsx}"). */
      glob: z.string().optional(),
      /** File type to search (e.g., "js", "py", "rust", "go", "java"). */
      type: z.string().optional(),
      /** Case insensitive search. */
      "-i": z.boolean().optional(),
      /** Show line numbers in output (requires output_mode: "content"). */
      "-n": z.boolean().optional(),
      /** Number of lines to show after each match (requires output_mode: "content"). */
      "-A": uint.optional(),
      /** Number of lines to show before each match (requires output_mode: "content"). */
      "-B": uint.optional(),
      /** Number of lines to show before and after each match (requires output_mode: "content"). */
      "-C": uint.optional(),
      /** Enable multiline mode where patterns can span lines (default: false). */
      multiline: z.boolean().optional(),
      /** Limit output to first N lines/entries/files. Works across all output modes. */
      head_limit: uint.optional(),
    }),
  }),

  task: z.object({
    type: z.literal("Task"),
    tool_name: z.literal("Task"),
    tool_input: z.object({
      /** Short (3-5 word) description of the task. */
      description: z.string(),
      /** Detailed instructions for the agent to perform autonomously. */
      prompt: z.string(),
      /** Type of specialized agent (e.g., "general-purpose", "Explore"). */
      subagent_type: z.string(),
      /** Model to use for this agent (defaults to parent model). */
      model: modelType.optional(),
      /** Agent ID to resume from a previous execution. */
      resume: z.string().optional(),
    }),
  }),

  todoWrite: z.object({
    type: z.literal("TodoWrite"),
    tool_name: z.literal("TodoWrite"),
    tool_input: z.object({
      /** Array of todo items with content, status, and active form. */
      todos: z.array(todoItem),
    }),
  }),

  webFetch: z.object({
    type: z.literal("WebFetch"),
    tool_name: z.literal("WebFetch"),
    tool_input: z.object({
      /** URL to fetch content from. */
      url: z.string(),
      /** Instructions for processing the fetched content. */
      prompt: z.string(),
    }),
  }),

  webSearch: z.object({
    type: z.literal("WebSearch"),
    tool_name: z.literal("WebSearch"),
    tool_input: z.object({
      /** Search query string. */
      query: z.string(),
      /** Only include search results from these domains. */
      allowed_domains: z.array(z.string()).optional(),
      /** Exclude search results from these domains. */
      blocked_domains: z.array(z.string()).optional(),
    }),
  }),

  slashCommand: z.object({
    type: z.literal("SlashCommand"),
    tool_name: z.literal("SlashCommand"),
    tool_input: z.object({
      /** Slash command to execute (e.g., "/commit"). */
      command: z.string(),
    }),
  }),

  bashOutput: z.object({
    type: z.literal("BashOutput"),
    tool_name: z.literal("BashOutput"),
    tool_input: z.object({
      /** ID of the background shell to retrieve output from. */
      bash_id: z.string(),
      /** Regex to filter output lines. Non-matching lines are discarded. */
      filter: z.string().optional(),
    }),
  }),

  killShell: z.object({
    type: z.literal("KillShell"),
    tool_name: z.literal("KillShell"),
    tool_input: z.object({
      /** ID of the background shell to terminate. */
      shell_id: z.string(),
    }),
  }),

  /** Fallback for unknown tools in PreToolUse */
  unknown: z.object({
    /** Property created during parsing to improve type inference. Use if- or
        switch- statements to inspect the `type` property and refine the
        attributes known to the type-checker.
     */
    type: z.literal("Other"),

    /** Name of the tool.

      MCP tools follow the following naming pattern:

      mcp__<server>__<tool>

      @example "mcp__github__search_repositories"
   */
    tool_name: z.string(),

    /** Input arguments for the tool call.

      The exact schema depends on the specific tool. Refine `type` using an if
      or switch statement to get type-safe property access for common tools.
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
      /** Absolute path to the file to read. */
      file_path: z.string(),
      /** Line number to start reading from (1-indexed). */
      offset: uint.optional(),
      /** Number of lines to read. */
      limit: uint.optional(),
    }),
    tool_response: z.object({
      type: z.literal("text"),
      file: z.object({
        /** Absolute path to the file that was read. */
        filePath: z.string(),
        /** File content (potentially partial). */
        content: z.string(),
        /** Number of lines in this response. */
        numLines: uint,
        /** Starting line number (1-indexed). */
        startLine: uint,
        /** Total number of lines in the file. */
        totalLines: uint,
      }),
    }),
  }),

  write: z.object({
    type: z.literal("Write"),
    tool_name: z.literal("Write"),
    tool_input: z.object({
      /** Absolute path to the file to write. */
      file_path: z.string(),
      /** Content to write to the file. */
      content: z.string(),
    }),
    tool_response: z.record(z.string(), z.unknown()),
  }),

  edit: z.object({
    type: z.literal("Edit"),
    tool_name: z.literal("Edit"),
    tool_input: z.object({
      /** Absolute path to the file to modify. */
      file_path: z.string(),
      /** Text to replace. */
      old_string: z.string(),
      /** Replacement text. */
      new_string: z.string(),
      /** Replace all occurrences of old_string (default: false). */
      replace_all: z.boolean().optional(),
    }),
    tool_response: z.record(z.string(), z.unknown()),
  }),

  glob: z.object({
    type: z.literal("Glob"),
    tool_name: z.literal("Glob"),
    tool_input: z.object({
      /** Glob pattern to match files against (e.g., "**\/*.ts"). */
      pattern: z.string(),
      /** Directory to search in. Defaults to current working directory. */
      path: z.string().optional(),
    }),
    tool_response: z.object({
      /** Array of absolute file paths matching the pattern. */
      filenames: z.array(z.string()),
      /** Duration of the search operation in milliseconds. */
      durationMs: uint,
      /** Total number of files found. */
      numFiles: uint,
      /** Whether results were truncated due to limits. */
      truncated: z.boolean(),
    }),
  }),

  notebookEdit: z.object({
    type: z.literal("NotebookEdit"),
    tool_name: z.literal("NotebookEdit"),
    tool_input: z.object({
      /** Absolute path to the Jupyter notebook file to edit. */
      notebook_path: z.string(),
      /** New source code for the cell. */
      new_source: z.string(),
      /** Cell ID to edit. When inserting, inserts after this cell. */
      cell_id: z.string().optional(),
      /** Cell type. Defaults to current cell type; required for insert mode. */
      cell_type: notebookCellType.optional(),
      /** Edit operation mode. Defaults to "replace". */
      edit_mode: notebookEditMode.optional(),
    }),
    tool_response: z.record(z.string(), z.unknown()),
  }),

  bash: z.object({
    type: z.literal("Bash"),
    tool_name: z.literal("Bash"),
    tool_input: z.object({
      /** Shell command to execute. */
      command: z.string(),
      /** Clear, concise description of command (5-10 words). */
      description: z.string().optional(),
      /** Timeout in milliseconds (max 600000, default: 120000). */
      timeout: uint.optional(),
      /** Execute command in background without blocking. */
      run_in_background: z.boolean().optional(),
    }),
    tool_response: z.object({
      /** Standard output from the command. */
      stdout: z.string(),
      /** Standard error from the command. */
      stderr: z.string(),
      /** Whether the command was interrupted. */
      interrupted: z.boolean(),
      /** Whether stdout contains an image. */
      isImage: z.boolean(),
    }),
  }),

  grep: z.object({
    type: z.literal("Grep"),
    tool_name: z.literal("Grep"),
    tool_input: z.object({
      /** Regular expression pattern to search for (ripgrep syntax). */
      pattern: z.string(),
      /** File or directory to search in. Defaults to current working directory. */
      path: z.string().optional(),
      /** Output format: "content" (matching lines), "files_with_matches" (file paths), or "count" (match counts). */
      output_mode: grepOutputMode.optional(),
      /** Glob pattern to filter files (e.g., "*.js", "*.{ts,tsx}"). */
      glob: z.string().optional(),
      /** File type to search (e.g., "js", "py", "rust", "go", "java"). */
      type: z.string().optional(),
      /** Case insensitive search. */
      "-i": z.boolean().optional(),
      /** Show line numbers in output (requires output_mode: "content"). */
      "-n": z.boolean().optional(),
      /** Number of lines to show after each match (requires output_mode: "content"). */
      "-A": uint.optional(),
      /** Number of lines to show before each match (requires output_mode: "content"). */
      "-B": uint.optional(),
      /** Number of lines to show before and after each match (requires output_mode: "content"). */
      "-C": uint.optional(),
      /** Enable multiline mode where patterns can span lines (default: false). */
      multiline: z.boolean().optional(),
      /** Limit output to first N lines/entries/files. Works across all output modes. */
      head_limit: uint.optional(),
    }),
    tool_response: z.union([
      z.object({
        /** Output mode used for the search. */
        mode: z.string(),
        /** Array of file paths containing matches. */
        filenames: z.array(z.string()),
        /** Total number of files with matches. */
        numFiles: uint,
      }),
      z.object({
        /** Matching lines from files (when output_mode is "content"). */
        content: z.string(),
      }),
      z.record(z.string(), z.unknown()),
    ]),
  }),

  task: z.object({
    type: z.literal("Task"),
    tool_name: z.literal("Task"),
    tool_input: z.object({
      /** Short (3-5 word) description of the task. */
      description: z.string(),
      /** Detailed instructions for the agent to perform autonomously. */
      prompt: z.string(),
      /** Type of specialized agent (e.g., "general-purpose", "Explore"). */
      subagent_type: z.string(),
      /** Model to use for this agent (defaults to parent model). */
      model: modelType.optional(),
      /** Agent ID to resume from a previous execution. */
      resume: z.string().optional(),
    }),
    tool_response: z.object({
      /** Agent execution status (e.g., "completed"). */
      status: z.string(),
      /** Original prompt given to the agent. */
      prompt: z.string(),
      /** Unique identifier for this agent execution. */
      agentId: z.string(),
      /** Array of response content blocks from the agent. */
      content: z.array(
        z.object({
          /** Content block type. */
          type: z.string(),
          /** Text content of the response. */
          text: z.string(),
        }),
      ),
      /** Total duration of agent execution in milliseconds. */
      totalDurationMs: uint,
      /** Total tokens consumed (input + output + cache). */
      totalTokens: uint,
      /** Total number of tool uses by the agent. */
      totalToolUseCount: uint,
      /** Detailed token usage breakdown. */
      usage: z.record(z.string(), z.unknown()),
    }),
  }),

  todoWrite: z.object({
    type: z.literal("TodoWrite"),
    tool_name: z.literal("TodoWrite"),
    tool_input: z.object({
      /** Array of todo items with content, status, and active form. */
      todos: z.array(todoItem),
    }),
    tool_response: z.object({
      /** Previous todo list state before the update. */
      oldTodos: z.array(todoItem),
      /** New todo list state after the update. */
      newTodos: z.array(todoItem),
    }),
  }),

  webFetch: z.object({
    type: z.literal("WebFetch"),
    tool_name: z.literal("WebFetch"),
    tool_input: z.object({
      /** URL to fetch content from. */
      url: z.string(),
      /** Instructions for processing the fetched content. */
      prompt: z.string(),
    }),
    tool_response: z.object({
      /** Response size in bytes. */
      bytes: uint,
      /** HTTP status code. */
      code: uint,
      /** HTTP status text (e.g., "OK", "Not Found"). */
      codeText: z.string(),
      /** Processed content result from the AI model. */
      result: z.string(),
      /** Request duration in milliseconds. */
      durationMs: uint,
      /** Final URL after any redirects. */
      url: z.string(),
    }),
  }),

  webSearch: z.object({
    type: z.literal("WebSearch"),
    tool_name: z.literal("WebSearch"),
    tool_input: z.object({
      /** Search query string. */
      query: z.string(),
      /** Only include search results from these domains. */
      allowed_domains: z.array(z.string()).optional(),
      /** Exclude search results from these domains. */
      blocked_domains: z.array(z.string()).optional(),
    }),
    tool_response: z.object({
      /** The search query that was executed. */
      query: z.string(),
      /** Array of search results. */
      results: z.array(z.unknown()),
      /** Search duration in seconds. */
      durationSeconds: z.number(),
    }),
  }),

  slashCommand: z.object({
    type: z.literal("SlashCommand"),
    tool_name: z.literal("SlashCommand"),
    tool_input: z.object({
      /** Slash command to execute (e.g., "/commit"). */
      command: z.string(),
    }),
    tool_response: z.object({
      /** Whether the command executed successfully. */
      success: z.boolean(),
      /** Name of the command that was executed. */
      commandName: z.string(),
    }),
  }),

  bashOutput: z.object({
    type: z.literal("BashOutput"),
    tool_name: z.literal("BashOutput"),
    tool_input: z.object({
      /** ID of the background shell to retrieve output from. */
      bash_id: z.string(),
      /** Regex to filter output lines. Non-matching lines are discarded. */
      filter: z.string().optional(),
    }),
    tool_response: z.object({
      /** ID of the shell. */
      shellId: z.string(),
      /** Command being executed in the shell. */
      command: z.string(),
      /** Current status of the shell (e.g., "running", "completed"). */
      status: z.string(),
      /** Exit code if completed, null if still running. */
      exitCode: z.number().int().nullable(),
      /** Standard output from the command. */
      stdout: z.string(),
      /** Standard error from the command. */
      stderr: z.string(),
      /** Number of lines in stdout. */
      stdoutLines: uint,
      /** Number of lines in stderr. */
      stderrLines: uint,
      /** Timestamp of the output. */
      timestamp: z.string(),
    }),
  }),

  killShell: z.object({
    type: z.literal("KillShell"),
    tool_name: z.literal("KillShell"),
    tool_input: z.object({
      /** ID of the background shell to terminate. */
      shell_id: z.string(),
    }),
    tool_response: z.object({
      /** Success or error message. */
      message: z.string(),
      /** ID of the terminated shell. */
      shell_id: z.string(),
    }),
  }),

  /** Fallback for unknown tools in PostToolUse */
  unknown: z.object({
    /** Property created during parsing to improve type inference. Use if- or
        switch- statements to inspect the `type` property and refine the
        attributes known to the type-checker.
     */
    type: z.literal("Other"),
    /** Refine `type` using an if or switch statement to get type-safe property
        access for common tools.
     */
    tool_name: z.string(),

    /** Input arguments for the tool call.

      The exact schema depends on the specific tool. Refine `type` using an if
      or switch statement to get type-safe property access for common tools.
   */
    tool_input: z.record(z.string(), z.unknown()),

    /** Output structure for the tool call.

      The exact schema depends on the specific tool. Refine `type` using an if
      or switch statement to get type-safe property access for common tools.
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
