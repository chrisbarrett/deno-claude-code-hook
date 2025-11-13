#!/usr/bin/env -S deno run --allow-read

import { postToolUse } from "../../mod.ts";

postToolUse(async (input) => {
  // Check for failed bash commands
  if (input.tool_name === "Bash" && input.tool_response.exit_code !== 0) {
    return {
      decision: "allow",
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: `Command failed with exit code ${input.tool_response.exit_code}`,
      },
    };
  }

  // Allow by default
  return {
    decision: "allow",
  };
});
