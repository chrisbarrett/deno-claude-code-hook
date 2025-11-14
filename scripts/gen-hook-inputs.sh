#!/usr/bin/env bash
# Test harness for Claude Code hooks
#
# Runs isolated Claude Code invocations to capture each hook type's payload.
# Each invocation configures only one hook type and uses a prompt designed
# to trigger that specific hook.

set -euo pipefail

gitroot=$(git rev-parse --show-toplevel)
cd "$gitroot"

declare -A hook_prompts=(
    ["SessionStart"]="Hello"
    ["SessionEnd"]="Hello"
    ["UserPromptSubmit"]="What is 2+2?"
    ["PreToolUse"]="List the files in the current directory"
    ["PostToolUse"]="List the files in the current directory"
    ["Stop"]="Hello"
)

outdir="${gitroot}/tests/inputs"
mkdir -p "$outdir"
rm -rf "${outdir}/*.json"

for hook_name in "${!hook_prompts[@]}"; do
    prompt="${hook_prompts[$hook_name]}"

    settings_json=$(jq -n --arg hook "$hook_name" '{
        hooks: {
            ($hook): [{
                hooks: [{ type: "command", command: ("./scripts/hook.sh " + $hook) }]
            }]
        }
    }')

    echo "+ claude ($hook_name)"
    claude -p "$prompt" --settings "$settings_json" &
done

wait

if [[ -d tests/inputs ]] && [[ -n $(ls -A tests/inputs/*.json 2>/dev/null) ]]; then
    echo "Cleaning hook content..."
    claude --model haiku -p "Anonymize all JSON files in tests/inputs/ by replacing machine-specific and sensitive data with generic placeholders:

- Replace session_id values with 'test-session-id'
- Replace cwd paths with '/test/project'
- Replace transcript_path with '/test/project/.claude/transcripts/test-session.json'
- Replace any user-specific paths (like /Users/username or /home/username) with /home/user
- Replace any file_path values in tool inputs with generic paths like '/test/project/example.ts'
- Replace any absolute paths in command strings with generic equivalents

Preserve the structure and all other data. Edit each JSON file in place."

    echo "Anonymization complete"
    deno fmt "${outdir}"/*.json
else
    >&2 echo "No hooks generated"
    exit 1
fi
