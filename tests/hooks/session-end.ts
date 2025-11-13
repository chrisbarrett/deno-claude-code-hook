#!/usr/bin/env -S deno run --allow-read

import { sessionEnd } from "../../mod.ts";

sessionEnd(async (input) => {
  // Log the reason for session end
  console.error(`[SESSION_END] Reason: ${input.reason}`);

  // SessionEnd hooks typically don't return anything
});
