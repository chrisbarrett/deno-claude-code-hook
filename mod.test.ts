import { assertEquals, assertRejects } from "@std/assert";
import { persistEnvVar } from "./mod.ts";

// Helper to set up a temporary env file
const withTempEnvFile = async (fn: (envFile: string) => Promise<void>) => {
  const tempFile = await Deno.makeTempFile();
  const originalEnv = Deno.env.get("CLAUDE_ENV_FILE");

  try {
    Deno.env.set("CLAUDE_ENV_FILE", tempFile);
    await fn(tempFile);
  } finally {
    await Deno.remove(tempFile);
    if (originalEnv !== undefined) {
      Deno.env.set("CLAUDE_ENV_FILE", originalEnv);
    } else {
      Deno.env.delete("CLAUDE_ENV_FILE");
    }
  }
};

Deno.test("persistEnvVar: writes valid environment variable", async () => {
  await withTempEnvFile(async (envFile) => {
    await persistEnvVar("TEST_VAR", "test_value");

    const content = await Deno.readTextFile(envFile);
    assertEquals(content, "export TEST_VAR='test_value'\n");
  });
});

Deno.test("persistEnvVar: escapes single quotes correctly", async () => {
  await withTempEnvFile(async (envFile) => {
    await persistEnvVar("TEST_VAR", "it's a test");

    const content = await Deno.readTextFile(envFile);
    // Should produce: export TEST_VAR='it'\''s a test'
    assertEquals(content, "export TEST_VAR='it'\\''s a test'\n");
  });
});

Deno.test("persistEnvVar: handles special characters in value", async () => {
  await withTempEnvFile(async (envFile) => {
    // Test various special characters that should NOT be interpreted
    await persistEnvVar("TEST_VAR", '$VAR `cmd` "quoted" \\ newline\n tab\t');

    const content = await Deno.readTextFile(envFile);
    // Single quotes protect everything except single quotes themselves
    assertEquals(
      content,
      "export TEST_VAR='$VAR `cmd` \"quoted\" \\ newline\n tab\t'\n",
    );
  });
});

Deno.test("persistEnvVar: appends multiple variables", async () => {
  await withTempEnvFile(async (envFile) => {
    await persistEnvVar("VAR1", "value1");
    await persistEnvVar("VAR2", "value2");
    await persistEnvVar("VAR3", "value3");

    const content = await Deno.readTextFile(envFile);
    assertEquals(
      content,
      "export VAR1='value1'\nexport VAR2='value2'\nexport VAR3='value3'\n",
    );
  });
});

Deno.test(
  "persistEnvVar: rejects variable name starting with digit",
  async () => {
    await withTempEnvFile(async () => {
      await assertRejects(
        async () => await persistEnvVar("123VAR", "value"),
        Error,
        "must match pattern",
      );
    });
  },
);

Deno.test("persistEnvVar: rejects variable name with hyphen", async () => {
  await withTempEnvFile(async () => {
    await assertRejects(
      async () => await persistEnvVar("MY-VAR", "value"),
      Error,
      "must match pattern",
    );
  });
});

Deno.test("persistEnvVar: rejects variable name with space", async () => {
  await withTempEnvFile(async () => {
    await assertRejects(
      async () => await persistEnvVar("MY VAR", "value"),
      Error,
      "must match pattern",
    );
  });
});

Deno.test("persistEnvVar: rejects empty variable name", async () => {
  await withTempEnvFile(async () => {
    await assertRejects(
      async () => await persistEnvVar("", "value"),
      Error,
      "must match pattern",
    );
  });
});

Deno.test("persistEnvVar: accepts valid variable names", async () => {
  await withTempEnvFile(async (envFile) => {
    // Test various valid names
    await persistEnvVar("VAR", "value1");
    await persistEnvVar("_VAR", "value2");
    await persistEnvVar("VAR123", "value3");
    await persistEnvVar("VAR_NAME", "value4");
    await persistEnvVar("_123", "value5");

    const content = await Deno.readTextFile(envFile);
    const lines = content.trim().split("\n");
    assertEquals(lines.length, 5);
    assertEquals(lines[0], "export VAR='value1'");
    assertEquals(lines[1], "export _VAR='value2'");
    assertEquals(lines[2], "export VAR123='value3'");
    assertEquals(lines[3], "export VAR_NAME='value4'");
    assertEquals(lines[4], "export _123='value5'");
  });
});

Deno.test("persistEnvVar: handles empty value", async () => {
  await withTempEnvFile(async (envFile) => {
    await persistEnvVar("EMPTY_VAR", "");

    const content = await Deno.readTextFile(envFile);
    assertEquals(content, "export EMPTY_VAR=''\n");
  });
});

Deno.test(
  "persistEnvVar: handles value with multiple single quotes",
  async () => {
    await withTempEnvFile(async (envFile) => {
      await persistEnvVar("TEST_VAR", "it's 'quoted' here's more");

      const content = await Deno.readTextFile(envFile);
      assertEquals(
        content,
        "export TEST_VAR='it'\\''s '\\''quoted'\\'' here'\\''s more'\n",
      );
    });
  },
);
