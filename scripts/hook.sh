#!/usr/bin/env bash
# Test hook that captures stdin to a JSON file

set -euo pipefail

hook_name="${1:-unknown}"

gitroot=$(git rev-parse --show-toplevel)
mkdir -p "$gitroot/tests/inputs"

cat >"$gitroot/tests/inputs/${hook_name}.json"

echo '{"continue": true, "suppressOutput": false}'
