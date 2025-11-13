#!/usr/bin/env -S deno run --allow-read

import { subagentStop } from "../../mod.ts";

subagentStop((input) => {
  // Don't allow recursive stop hooks to prevent infinite loops
  if (input.stop_hook_active) {
    return {
      decision: "allow",
    };
  }

  // Block stopping and ask subagent to provide a summary
  return {
    decision: "block",
    reason: "Please provide a summary of completed work",
  };
});
