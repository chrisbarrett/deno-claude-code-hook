#!/usr/bin/env -S deno run --allow-read

import { userPromptSubmit } from "../../mod.ts";

userPromptSubmit(async (input) => {
  const prompt = input.prompt.toLowerCase();

  // Block dangerous prompts
  if (prompt.includes("delete production") || prompt.includes("drop database")) {
    return {
      decision: "block",
      reason: "Dangerous operations blocked in production environment",
    };
  }

  // Add context for test-related prompts
  if (prompt.includes("test")) {
    return {
      decision: "allow",
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: "You are working on tests. Prioritize test-related suggestions.",
      },
    };
  }

  // Allow by default
  return {
    decision: "allow",
  };
});
