#!/usr/bin/env bash
# collage-broll environment self-check.
# Exit 0 = all good; exit 1 = at least one item missing (details on stdout).
# The ElevenLabs connector is checked by Claude separately (it isn't visible from the shell).

set -u

VENV_PY="$HOME/collage-broll-projects/.omni-venv/bin/python"
FAIL=0

ok()   { printf 'PASS  %s\n' "$1"; }
bad()  { printf 'FAIL  %s\n' "$1"; FAIL=1; }

# 1. GEMINI_API_KEY
if [ -n "${GEMINI_API_KEY:-}" ]; then
  ok "GEMINI_API_KEY is set"
else
  bad "GEMINI_API_KEY not set (create one at https://aistudio.google.com/apikey and export it in your shell config)"
fi

# 2. ffmpeg / ffprobe
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  ok "ffmpeg / ffprobe available"
else
  bad "ffmpeg / ffprobe missing (macOS: brew install ffmpeg; Debian/Ubuntu: sudo apt install ffmpeg)"
fi

# 3. Python >= 3.10
if command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; then
  ok "python3 >= 3.10"
else
  bad "python3 missing or older than 3.10"
fi

# 4. shared venv with google-genai >= 2.10.0
if [ -x "$VENV_PY" ] && "$VENV_PY" - <<'PY' 2>/dev/null
import sys
from google import genai
parts = [int(x) for x in genai.__version__.split(".")[:2]]
sys.exit(0 if parts >= [2, 10] else 1)
PY
then
  ok "shared venv ready (google-genai >= 2.10.0)"
else
  bad "shared venv missing or google-genai too old (create: python3 -m venv ~/collage-broll-projects/.omni-venv && ~/collage-broll-projects/.omni-venv/bin/python -m pip install --upgrade 'google-genai>=2.10.0' 'httpx[socks]')"
fi

exit $FAIL
