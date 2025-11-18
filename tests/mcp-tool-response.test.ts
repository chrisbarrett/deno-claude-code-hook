/** Test that MCP tool responses can be JSON strings. */
import { expect } from "@std/expect";
import { runHook } from "../testing.ts";

const hookPath = import.meta.resolve("./hooks/post-tool-use.ts");

Deno.test(
  "postToolUse - handles MCP tool with stringified tool_response",
  async () => {
    // Simulate the exact payload from the error log
    const result = await runHook(hookPath, {
      session_id: "test-session-id",
      transcript_path: "/path/to/project/transcript.jsonl",
      cwd: "/path/to/project",
      permission_mode: "acceptEdits",
      hook_event_name: "PostToolUse",
      tool_name: "mcp__aws-docs__search_documentation",
      tool_input: {
        search_phrase: "S3 bucket default private public access",
        limit: 10,
      },
      // This is a JSON string, not an object - the actual format from Claude Code
      tool_response:
        '{"result":[{"rank_order":1,"url":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html","title":"Examples of Amazon S3 bucket policies"}]}',
    });

    // Should parse successfully and allow the tool
    expect(result).toMatchObject({
      status: 0,
      stdout: {
        decision: "allow",
      },
    });
  },
);

Deno.test("postToolUse - handles MCP tool with object response", async () => {
  const result = await runHook(hookPath, {
    session_id: "test-session",
    transcript_path: "/path/to/transcript.jsonl",
    cwd: "/path/to/cwd",
    permission_mode: "acceptEdits",
    hook_event_name: "PostToolUse",
    tool_name: "mcp__some__tool",
    tool_input: { foo: "bar" },
    tool_response: { result: "success" },
  });

  // Should also work fine
  expect(result).toMatchObject({
    status: 0,
    stdout: {
      decision: "allow",
    },
  });
});
