#!/usr/bin/env bash
# Creative Destruction — launch the local server.
cd "$(dirname "$0")" || exit 1
if command -v python >/dev/null 2>&1; then exec python serve.py "$@"
elif command -v python3 >/dev/null 2>&1; then exec python3 serve.py "$@"
elif command -v py >/dev/null 2>&1; then exec py serve.py "$@"
else echo "Python 3 not found on PATH."; exit 1; fi
