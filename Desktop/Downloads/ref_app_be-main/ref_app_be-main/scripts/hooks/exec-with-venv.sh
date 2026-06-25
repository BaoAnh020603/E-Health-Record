#!/usr/bin/env bash
# Prepend the repo venv bin to PATH so git hooks find `uv` when the IDE/git
# invokes commits with a minimal PATH (Cursor, VS Code, GUI clients, etc.).
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"

PROJECT_ENV="${UV_PROJECT_ENVIRONMENT:-}"
if [ -z "$PROJECT_ENV" ]; then
    if [ -x "$ROOT/.venv-huan/bin/python" ]; then
        PROJECT_ENV=".venv-huan"
    else
        PROJECT_ENV=".venv"
    fi
    export UV_PROJECT_ENVIRONMENT="$PROJECT_ENV"
fi

export PATH="$ROOT/$PROJECT_ENV/bin:${PATH:-}"

# Ensure uv is in PATH if not already present, checking common user installation paths.
if ! command -v uv &> /dev/null; then
    for path_dir in "$HOME/.local/bin" "$HOME/.cargo/bin" "/usr/local/bin"; do
        if [ -d "$path_dir" ] && [ -x "$path_dir/uv" ]; then
            export PATH="$path_dir:$PATH"
            break
        fi
    done
fi

exec "$@"
