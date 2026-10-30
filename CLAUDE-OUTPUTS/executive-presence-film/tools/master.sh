#!/bin/sh
# Two-pass loudnorm on the audio alone (−14 LUFS, −1.2 dBTP), then mux with the picture.
# Done in two steps because ffmpeg 6.x mis-reports audio length when loudnorm runs inside the mux.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); O=$HERE/out
VIDEOS=${*:-"video.mp4:executive-presence.mp4"}     # pairs of out/<picture>:<film name>
J=$(ffmpeg -hide_banner -nostats -i "$O/mix.wav" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
ffmpeg -hide_banner -loglevel error -y -i "$O/mix.wav" -af "loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 -c:a pcm_s24le "$O/master.wav"
for pair in $VIDEOS; do
  V=$O/${pair%%:*}; F=$HERE/${pair#*:}
  VA=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V"); AA=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$O/master.wav")
  echo "${pair#*:}: video $VA s, audio $AA s"
  ffmpeg -hide_banner -loglevel error -y -i "$V" -i "$O/master.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$F"
  ffmpeg -hide_banner -nostats -i "$F" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E " I:"
done
