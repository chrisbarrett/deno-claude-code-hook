#!/usr/bin/env -S deno run --allow-read

import { sessionStart } from "../../mod.ts";

sessionStart((input) => {
  // Add context based on session source
  let contextMessage = "";

  switch (input.source) {
    case "startup":
      contextMessage = "Fresh session started";
      break;
    case "resume":
      contextMessage = "Resuming previous session";
      break;
    case "clear":
      contextMessage = "Session cleared, starting fresh";
      break;
    case "compact":
      contextMessage = "Session restarted after compaction";
      break;
  }

  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: contextMessage,
    },
  };
});
