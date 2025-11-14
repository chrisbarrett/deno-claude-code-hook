#!/usr/bin/env bash
set -euo pipefail

# Anonymize test input JSON files by replacing machine-specific paths and IDs
# with generic placeholders using jq.

cd "$(dirname "$0")/.."

inputs_dir="tests/inputs"

echo "Anonymizing JSON files in $inputs_dir..."

for json_file in "$inputs_dir"/*.json; do
    echo "  Processing $(basename "$json_file")..."

    jq '
        # Replace all session IDs with generic test ID
        .session_id = "test-session-id" |

        # Replace transcript paths with generic path
        .transcript_path = "/test/project/.claude/transcripts/test-session.json" |

        # Replace cwd with generic project path
        .cwd = "/test/project" |

        # Walk through entire structure and replace user-specific paths
        walk(
            if type == "string" then
                # Replace any occurrence of the real project path
                gsub("/Users/[^/]+/src/[^/]+/deno-claude-code-hook"; "/test/project") |
                gsub("/Users/[^/]+/\\.claude/projects/[^/]+/[0-9a-f-]+\\.jsonl"; "/test/project/.claude/transcripts/test-session.json")
            else
                .
            end
        )
    ' "$json_file" | sponge "$json_file"
done

echo "✓ Anonymization complete!"
