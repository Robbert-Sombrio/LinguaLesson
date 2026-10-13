#!/usr/bin/env bash
# QA images for collage-broll.
#   qa_sheets.sh stills <project> <out.jpg>
#       Numbered contact sheet of every still variation (01-x/frames/variations/*) -> labels 1a, 1b, 2a ...
#   qa_sheets.sh video <run-dir> <approved-last-frame.png>
#       Strips audio, builds contact-sheet.jpg, video-last-frame.jpg, end-frame-comparison.jpg, prints specs.
#   qa_sheets.sh batch <project>
#       omni-contact-sheet-all.jpg, video-first-frame-all.jpg, end-frame-comparison-all.jpg
set -euo pipefail

mode="${1:-}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

# Find a font for drawtext labels (optional).
FONT=""
for f in /System/Library/Fonts/Supplemental/Arial.ttf /System/Library/Fonts/Helvetica.ttc \
         /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf /usr/share/fonts/dejavu/DejaVuSans-Bold.ttf; do
  [ -f "$f" ] && { FONT="$f"; break; }
done

label() { # label <in> <text> <out>  (270x480 tile with a label in the corner)
  local vf="scale=270:480:force_original_aspect_ratio=decrease,pad=270:480:(ow-iw)/2:(oh-ih)/2:color=white"
  if [ -n "$FONT" ]; then
    vf="$vf,drawtext=fontfile='$FONT':text='$2':x=10:y=10:fontsize=32:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=6"
  fi
  ffmpeg -loglevel error -y -i "$1" -vf "$vf" -frames:v 1 "$3"
}

tile() { # tile <out> <files...>  (rows of up to 5)
  local out="$1"; shift
  local n=$#; local cols=$(( n < 5 ? n : 5 )); local rows=$(( (n + 4) / 5 ))
  local i=0
  for f in "$@"; do cp "$f" "$tmp/t_$(printf %03d $i).png"; i=$((i+1)); done
  ffmpeg -loglevel error -y -framerate 1 -i "$tmp/t_%03d.png" \
    -vf "tile=${cols}x${rows}:padding=6:color=white" -frames:v 1 "$out"
  rm -f "$tmp"/t_*.png
}

case "$mode" in
  stills)
    project="$2"; out="$project/${3:-still-contact-sheet.jpg}"
    tiles=()
    for item in "$project"/[0-9][0-9]-*/; do
      num=$((10#$(basename "$item" | cut -c1-2)))
      for v in "$item"frames/variations/*; do
        [ -f "$v" ] || continue
        letter="$(basename "${v%.*}")"
        t="$tmp/s_${num}${letter}.png"; label "$v" "${num}${letter}" "$t"; tiles+=("$t")
      done
    done
    [ ${#tiles[@]} -gt 0 ] || { echo "no variations found under $project/NN-*/frames/variations/"; exit 1; }
    tile "$out" "${tiles[@]}"; echo "wrote $out"
    ;;
  video)
    run="$2"; still="$3"
    ffmpeg -loglevel error -y -i "$run/final-5s.mp4" -map 0:v:0 -c:v copy -an "$run/final-5s-noaudio.mp4"
    ffmpeg -loglevel error -y -i "$run/final-5s-noaudio.mp4" \
      -vf "fps=1,scale=270:480,tile=5x1" -frames:v 1 "$run/contact-sheet.jpg"
    ffmpeg -loglevel error -y -sseof -0.1 -i "$run/final-5s-noaudio.mp4" -update 1 -frames:v 1 "$run/video-last-frame.jpg"
    label "$still" "approved" "$tmp/a.png"; label "$run/video-last-frame.jpg" "video" "$tmp/b.png"
    tile "$run/end-frame-comparison.jpg" "$tmp/a.png" "$tmp/b.png"
    echo "--- specs ($run/final-5s-noaudio.mp4)"
    ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate \
      -show_entries format=duration -of default=nw=1 "$run/final-5s-noaudio.mp4"
    echo "audio_streams=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$run/final-5s-noaudio.mp4" | wc -l | tr -d ' ')"
    ;;
  batch)
    project="$2"; sheets=(); firsts=(); comps=()
    for item in "$project"/[0-9][0-9]-*/; do
      run="$(ls -d "$item"omni/run-v* 2>/dev/null | sort | tail -1)"
      [ -n "$run" ] && [ -f "$run/final-5s-noaudio.mp4" ] || continue
      num=$((10#$(basename "$item" | cut -c1-2)))
      sheets+=("$run/contact-sheet.jpg"); comps+=("$run/end-frame-comparison.jpg")
      ffmpeg -loglevel error -y -i "$run/final-5s-noaudio.mp4" -frames:v 1 "$tmp/f_$num.png"
      label "$tmp/f_$num.png" "$num" "$tmp/fl_$num.png"; firsts+=("$tmp/fl_$num.png")
    done
    [ ${#sheets[@]} -gt 0 ] || { echo "no finished runs found"; exit 1; }
    vstack() { local out="$1"; shift; local args=(); for f in "$@"; do args+=(-i "$f"); done
      if [ $# -eq 1 ]; then cp "$1" "$out"; else
        ffmpeg -loglevel error -y "${args[@]}" -filter_complex "vstack=inputs=$#" -frames:v 1 "$out"; fi; }
    vstack "$project/omni-contact-sheet-all.jpg" "${sheets[@]}"
    vstack "$project/end-frame-comparison-all.jpg" "${comps[@]}"
    tile "$project/video-first-frame-all.jpg" "${firsts[@]}"
    echo "wrote omni-contact-sheet-all.jpg, video-first-frame-all.jpg, end-frame-comparison-all.jpg in $project"
    ;;
  *) echo "usage: $0 stills <project> <out.jpg> | video <run-dir> <still.png> | batch <project>"; exit 2 ;;
esac
