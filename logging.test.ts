import { expect } from "@std/expect";
import { join } from "@std/path";
import { configureLogging, getLogger } from "./logging.ts";
import { reset } from "@logtape/logtape";

Deno.test("log rotation: rotates files when maxSize exceeded", async () => {
  const tempDir = await Deno.makeTempDir();
  const logFile = join(tempDir, "test.log");

  try {
    await configureLogging({
      file: logFile,
      maxSize: 1024, // 1 KB to trigger rotation quickly
      maxFiles: 3,
      disableStderr: true,
    });

    const logger = getLogger("rotation-test");

    // Write enough data to trigger multiple rotations
    // Each message is ~100 bytes, so 50 messages should trigger rotation
    for (let i = 0; i < 50; i++) {
      logger.info(
        "Log message {i}: padding to increase size xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        { i },
      );
    }

    // Reset logtape to flush and close files
    await reset();

    // Check that rotated files exist
    const files = [];
    for await (const entry of Deno.readDir(tempDir)) {
      files.push(entry.name);
    }

    expect(files).toContain("test.log");
    expect(files).toContain("test.log.1");
    // Should have at least 2 rotated files given the amount of data
    expect(files.length).toBeGreaterThanOrEqual(2);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("log rotation: respects maxFiles limit", async () => {
  const tempDir = await Deno.makeTempDir();
  const logFile = join(tempDir, "test.log");

  try {
    await configureLogging({
      file: logFile,
      maxSize: 512, // Very small to trigger lots of rotations
      maxFiles: 2,
      disableStderr: true,
    });

    const logger = getLogger("maxfiles-test");

    // Write lots of data to trigger many rotations
    for (let i = 0; i < 100; i++) {
      logger.info(
        "Log message {i}: padding to increase size xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        { i },
      );
    }

    await reset();

    const files = [];
    for await (const entry of Deno.readDir(tempDir)) {
      files.push(entry.name);
    }

    // Should have at most maxFiles + 1 (current + rotated)
    // test.log, test.log.1, test.log.2
    expect(files.length).toBeLessThanOrEqual(3);
    expect(files).toContain("test.log");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
