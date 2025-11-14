#!/usr/bin/env bash
# Test harness for Claude Code hooks
#
# Runs isolated Claude Code invocations to capture each hook type's payload.
# Each invocation configures only one hook type and uses a prompt designed
# to trigger that specific hook.

set -euo pipefail

# shellcheck disable=SC2039
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root=$(git -C "$script_dir" rev-parse --show-toplevel)
cd "$repo_root"
outdir="${repo_root}/tests/inputs"

tmp_files=()

cleanup() {
    echo "Cleaning up test fixtures..."
    for file in "${tmp_files[@]}"; do
        rm -f "$file"
    done
}
trap cleanup EXIT INT TERM

declare -A hook_prompts=(
    ["SessionStart"]="Hello"
    ["SessionEnd"]="Hello"
    ["UserPromptSubmit"]="What is 2+2?"
    ["Stop"]="Hello"
)

declare -A tool_prompts=(
    ["Read"]="Use the Read tool to read the file at mod.ts. Use *ONLY* the Read tool."
    ["Write"]="Use the Write tool to create a new file at /tmp/test-write-output.txt with the content 'test data'. Use *ONLY* the Write tool."
    ["Edit"]="Use the Edit tool to edit /tmp/test-edit-target.json, replacing '\"hello\"' with '\"world\"'. Use *ONLY* the Edit tool."
    ["Glob"]="Use the Glob tool to find all files matching the pattern '*.ts'. Use *ONLY* the Glob tool."
    ["Bash"]="Use the Bash tool to run the command 'pwd'. Use *ONLY* the Bash tool."
    ["Grep"]="Use the Grep tool to search for the pattern 'export' in the current directory. Use *ONLY* the Grep tool."
    ["Task"]="Use the Task tool to launch a haiku agent with description 'test task' to answer: what is 2+2?. Use *ONLY* the Task tool."
    ["NotebookEdit"]="Use the NotebookEdit tool to edit the notebook at /tmp/test-notebook-edit.ipynb, replacing the first cell with 'print(1)'. Use *ONLY* the NotebookEdit tool."
    ["TodoWrite"]="Use the TodoWrite tool to create a todo list with one item: 'test task'. Use *ONLY* the TodoWrite tool."
    ["WebFetch"]="Use the WebFetch tool to fetch content from https://example.com with prompt 'extract the page title'. Use *ONLY* the WebFetch tool."
    ["WebSearch"]="Use the WebSearch tool to search for 'Claude Code hooks documentation'. Use *ONLY* the WebSearch tool."
    ["SlashCommand"]="Use the SlashCommand tool to execute the command '/test-command'. Use *ONLY* the SlashCommand tool."
)

# Special case: Background bash workflow uses multiple tools in sequence
declare -A workflow_prompts=(
    ["BackgroundBash"]="Start a background bash job that runs 'sleep 30 && echo done', then IMMEDIATELY use BashOutput to check its output (it will be empty/running), then IMMEDIATELY use KillShell to kill it while it's still running. Follow this exact sequence: 1) Use Bash tool with run_in_background=true to start 'sleep 30 && echo done', 2) IMMEDIATELY use BashOutput to retrieve output using the shell ID (don't wait), 3) IMMEDIATELY use KillShell to terminate the running background shell."
)

mkdir -p "$outdir"
rm -f "$outdir"/*.json 2>/dev/null || true

# Create test fixtures from templates
cp "${script_dir}/file-templates/test-notebook.ipynb" /tmp/test-notebook-edit.ipynb
tmp_files+=(/tmp/test-notebook-edit.ipynb)

# For Edit: create a simple JSON file
echo '{"greeting": "hello"}' >/tmp/test-edit-target.json
tmp_files+=(/tmp/test-edit-target.json)

# Write tool will create its own file, but track it for cleanup
tmp_files+=(/tmp/test-write-output.txt)

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
    claude --model haiku -p "$prompt" --settings "$settings_json" --permission-mode bypassPermissions >/dev/null &
done

for tool_name in "${!tool_prompts[@]}"; do
    prompt="${tool_prompts[$tool_name]}"

    settings_json=$(jq -n --arg tool "$tool_name" '{
        hooks: {
            PreToolUse: [{
                hooks: [{ type: "command", command: ("./scripts/hook.sh PreToolUse " + $tool) }]
            }],
            PostToolUse: [{
                hooks: [{ type: "command", command: ("./scripts/hook.sh PostToolUse " + $tool) }]
            }],
        }
    }')

    echo "+ claude (PreToolUse.$tool_name, PostToolUse.$tool_name)"
    # NOTE: permissions must be bypassed to avoid tool prompts.
    claude --model haiku -p "$prompt" --settings "$settings_json" --permission-mode bypassPermissions >/dev/null &
done

# Handle multi-tool workflows
for workflow_name in "${!workflow_prompts[@]}"; do
    prompt="${workflow_prompts[$workflow_name]}"

    # For background bash workflow, we need to capture BashOutput and KillShell
    if [[ "$workflow_name" == "BackgroundBash" ]]; then
        settings_json=$(jq -n '{
            hooks: {
                PreToolUse: [{
                    hooks: [{ type: "command", command: "./scripts/hook.sh PreToolUse BashOutput" }]
                }, {
                    hooks: [{ type: "command", command: "./scripts/hook.sh PreToolUse KillShell" }]
                }],
                PostToolUse: [{
                    hooks: [{ type: "command", command: "./scripts/hook.sh PostToolUse BashOutput" }]
                }, {
                    hooks: [{ type: "command", command: "./scripts/hook.sh PostToolUse KillShell" }]
                }]
            }
        }')

        echo "+ claude ($workflow_name: BashOutput, KillShell)"
        claude --model haiku -p "$prompt" --settings "$settings_json" --permission-mode bypassPermissions >/dev/null &
    fi
done

wait

if [[ -d tests/inputs ]] && [[ -n $(ls -A tests/inputs/*.json 2>/dev/null) ]]; then
    "${script_dir}/anonymize-test-inputs.sh"
    deno fmt "${outdir}"/*.json
else
    >&2 echo "No hooks generated"
    exit 1
fi

echo "Test data generation complete!"
