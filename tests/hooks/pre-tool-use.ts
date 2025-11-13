#!/usr/bin/env -S deno run --allow-read

import { preToolUse } from "../../mod.ts";

preToolUse(async (input) => {
  // Block Write tool
  if (input.tool_name === "Write") {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Write operations are blocked in this test",
      },
    };
  }

  // Allow other tools
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: "Tool is allowed",
    },
  };
});
