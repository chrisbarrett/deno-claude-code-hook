#!/usr/bin/env -S deno run --allow-read

import { notification } from "../../mod.ts";

notification((input) => {
  // Notification hook typically doesn't return anything
  // Just log the message to stderr for debugging
  console.error(`[NOTIFICATION] ${input.message}`);
});
