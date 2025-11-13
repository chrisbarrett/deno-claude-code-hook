#!/usr/bin/env -S deno run --allow-read

import { preCompact } from "../../mod.ts";

preCompact(async (input) => {
  // Log the trigger and custom instructions
  if (input.trigger === "manual") {
    console.error(
      `[COMPACT] Manual compaction with instructions: ${input.custom_instructions || "none"}`,
    );
  } else {
    console.error("[COMPACT] Auto compaction triggered");
  }

  // PreCompact hooks don't typically return anything
});
