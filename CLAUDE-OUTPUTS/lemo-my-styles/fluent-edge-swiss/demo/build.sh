#!/bin/sh
# Rebuild the Fluent Edge Swiss demo film. Everything it writes goes to $OUT (default /tmp/fluent-edge-swiss-out);
# demo/ itself is left untouched.
set -e
LIB=${LIB:-/home/user/lemomo-ai/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${OUT:-/tmp/fluent-edge-swiss-out}
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
W=$OUT/work; rm -rf "$W"; mkdir -p "$W"; cp -R "$HERE"/. "$W"/
ffmpeg -loglevel error -y -i "$W/voice/take1.mp3" -ar 48000 -ac 1 "$W/voice/take1.wav"
python3 "$W/tools/build_timeline.py"
cd "$LIB"
node core/render/events.mjs "$W"
node core/render/video.mjs "$W" --fps 24 --workers 4 --out "$W/out/video.mp4"
"$LIB/.venv/bin/python" -I "$W/mix.py"
"$LIB/.venv/bin/python" -I core/render/srt.py "$W/cues.json" "$W/executive-presence.srt"
sh "$W/tools/master.sh"
cp "$W/executive-presence.mp4" "$W/executive-presence.srt" "$OUT/"
echo "film: $OUT/executive-presence.mp4"
