#!/usr/bin/env -S deno run --allow-read

import { postToolUse } from "../../mod.ts";

postToolUse((input) => {
  // Log file modifications
  if (input.tool_name === "Write" || input.tool_name === "Edit") {
    console.log(`Modified: ${input.tool_input.file_path}`);
  }

  // Check if bash command was interrupted
  if (input.tool_name === "Bash" && input.tool_response.interrupted) {
    return {
      decision: "allow",
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: "Command was interrupted",
      },
    };
  }

  // Allow by default
  return {
    decision: "allow",
  };
});
