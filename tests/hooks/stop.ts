#!/usr/bin/env -S deno run --allow-read

import { stop } from "../../mod.ts";

stop((input) => {
  // Don't allow recursive stop hooks to prevent infinite loops
  if (input.stop_hook_active) {
    return {
      decision: "allow",
    };
  }

  // Block stopping and ask Claude to continue with a specific task
  return {
    decision: "block",
    reason: "Please verify the changes before stopping",
  };
});
