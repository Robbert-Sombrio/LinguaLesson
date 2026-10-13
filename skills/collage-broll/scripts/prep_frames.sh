#!/usr/bin/env bash
# Frame prep for collage-broll.
#   prep_frames.sh blank <item-dir> <HEX>   -> <item>/frames/first-frame.png (1080x1920 flat colour)
#   prep_frames.sh last  <item-dir>         -> crops frames/last-frame-original.png to frames/last-frame.png
set -euo pipefail

mode="${1:-}"; item="${2:-}"
[ -n "$mode" ] && [ -n "$item" ] || { echo "usage: $0 blank <item> <HEX> | last <item>"; exit 2; }
mkdir -p "$item/frames"

case "$mode" in
  blank)
    hex="${3:-}"; hex="${hex#\#}"
    [[ "$hex" =~ ^[0-9A-Fa-f]{6}$ ]] || { echo "need a 6-digit hex colour, e.g. D9572B"; exit 2; }
    ffmpeg -loglevel error -y -f lavfi -i "color=c=0x${hex}:s=1080x1920" \
      -frames:v 1 "$item/frames/first-frame.png"
    echo "wrote $item/frames/first-frame.png"
    ;;
  last)
    src="$item/frames/last-frame-original.png"
    [ -f "$src" ] || { echo "missing $src"; exit 1; }
    ffmpeg -loglevel error -y -i "$src" \
      -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
      "$item/frames/last-frame.png"
    echo "wrote $item/frames/last-frame.png"
    ;;
  *) echo "unknown mode: $mode"; exit 2 ;;
esac
