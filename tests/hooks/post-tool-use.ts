#!/usr/bin/env -S deno run --allow-read

import { postToolUse } from "../../mod.ts";

postToolUse((input) => {
  // Log file modifications
  if (input.type === "Write" || input.type === "Edit") {
    console.log(`Modified: ${input.tool_input.file_path}`);
  }

  // Check if bash command was interrupted
  if (input.type === "Bash" && input.tool_response.interrupted) {
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
