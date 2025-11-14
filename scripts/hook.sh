#!/usr/bin/env bash
# @describe Test hook that captures stdin to a JSON file
# @meta require-tools jq
#
# The script validates the payload matches expectations before writing.
# If validation fails, the file is not written (preventing capture of wrong tool calls).

set -euo pipefail

# @arg hook_name! Expected value of hook_event_name (e.g., "PreToolUse", "SessionStart")
# @arg tool_name Optional expected value of tool_name (e.g., "Read", "Write")

eval "$(argc --argc-eval "$0" "$@")"

# shellcheck disable=SC2154
expected_hook="$argc_hook_name"
# shellcheck disable=SC2154
expected_tool="${argc_tool_name:-}"

gitroot=$(git rev-parse --show-toplevel)
mkdir -p "$gitroot/tests/inputs"

# Read stdin into variable
payload=$(cat)

# Extract hook_event_name from payload
actual_hook=$(echo "$payload" | jq -r '.hook_event_name // empty')

# Validate hook_event_name matches
if [[ "$actual_hook" != "$expected_hook" ]]; then
    >&2 echo "Skipping: hook_event_name mismatch (expected: $expected_hook, got: $actual_hook)"
    echo '{"continue": true, "suppressOutput": false}'
    exit 0
fi

# If tool_name is provided, validate it matches
if [[ -n "$expected_tool" ]]; then
    actual_tool=$(echo "$payload" | jq -r '.tool_name // empty')
    if [[ "$actual_tool" != "$expected_tool" ]]; then
        >&2 echo "Skipping: tool_name mismatch (expected: $expected_tool, got: $actual_tool)"
        echo '{"continue": true, "suppressOutput": false}'
        exit 0
    fi
fi

# Validation passed - write the payload
output_file="$gitroot/tests/inputs/${expected_hook}"
[[ -n "$expected_tool" ]] && output_file="${output_file}.${expected_tool}"
output_file="${output_file}.json"

echo "$payload" >"$output_file"

echo '{"continue": true, "suppressOutput": false}'
