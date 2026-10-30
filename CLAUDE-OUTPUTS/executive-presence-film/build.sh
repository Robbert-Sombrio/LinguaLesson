#!/bin/sh
# Rebuild the film from source: timeline → picture → events → score, foley and voice → master.
set -e
LIB=${LIB:-/home/user/lemomo-ai/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
[ -f "$HERE/voice/take1.wav" ] || ffmpeg -loglevel error -y -i "$HERE/voice/take1.mp3" -ar 48000 -ac 1 "$HERE/voice/take1.wav"
python3 "$HERE/tools/build_timeline.py"
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"                    # social cut: captions burned in
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --q nosub=1 --out "$HERE/out/video-nosub.mp4"  # YouTube master
"$LIB/.venv/bin/python" -I "$HERE/mix.py"
"$LIB/.venv/bin/python" -I core/render/srt.py "$HERE/cues.json" "$HERE/executive-presence.srt"
sh "$HERE/tools/master.sh" video-nosub.mp4:executive-presence-youtube.mp4 video.mp4:executive-presence-social.mp4
ffmpeg -loglevel error -y -ss 33.9 -i "$HERE/executive-presence-youtube.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
