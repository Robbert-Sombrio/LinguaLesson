# collage-broll (Claude edition)

<p align="center">
  <img src="assets/demo-purple.gif" width="180" alt="Purple field: a team presses out a sci-fi film strip">
  <img src="assets/demo-yellow.gif" width="180" alt="Mustard field: a printing press mass-copies a mistake">
  <img src="assets/demo-red.gif" width="180" alt="Red field: a director's hand places pieces on a chessboard">
  <img src="assets/demo-teal.gif" width="180" alt="Teal field: scissors cut open a film track">
</p>

Give Claude one ~5 second voiceover line. It turns the line into one sharp visual metaphor, then into a halftone paper-collage clip that builds itself piece by piece on a flat colour field. You get a 9:16, 5 second, 720×1280, 24fps silent MP4 to drop under your voiceover.

This is a Claude Code port of [pyang5166/gbro-collage-broll](https://github.com/pyang5166/gbro-collage-broll), which was built for OpenAI Codex. The Codex-only image step now runs through your ElevenLabs connector, and the instructions are in English.

## How it works: 3 approval gates

1. **Gate 1, metaphor.** Text only: the core meaning, key objects, colours, and assembly order. Nothing is generated and nothing costs money.
2. **Gate 2, still frame.** ElevenLabs (Nano Banana Pro) makes 4 variations per line. You pick one.
3. **Gate 3, video.** Gemini Omni Flash animates from an empty colour field to your approved still. Claude strips the audio and checks the result frame by frame.

In a batch, you can approve some lines and send others back for changes.

## Requirements

| Need | Notes |
|------|-------|
| ElevenLabs connector | Connected in claude.ai. Image generation spends ElevenLabs credits. |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/apikey). Video is billed per clip. |
| Python 3.10+ | For the video script |
| ffmpeg / ffprobe | `brew install ffmpeg` |

The skill runs `scripts/check_setup.sh` on first use and tells you exactly what's missing. It creates its own Python environment in `~/collage-broll-projects/.omni-venv/` after asking you.

## Install

Unzip into your Claude skills folder:

```bash
mkdir -p ~/.claude/skills && unzip -o ~/Downloads/collage-broll.zip -d ~/.claude/skills/
```

## Use

```text
collage b-roll: Most people think AI is here to think for you. It's more like a mirror that shows you the holes in your question.
```

## Files

```text
collage-broll/
├── SKILL.md               # the instructions Claude follows
├── evals/evals.json       # 4 behaviour checks for the gates
└── scripts/
    ├── check_setup.sh     # first-run environment check
    ├── prep_frames.sh     # blank 9:16 colour card + last-frame crop
    ├── qa_sheets.sh       # contact sheets, audio strip, end-frame comparison
    ├── generate_video.py  # Gemini Omni Flash batch video generation (from the original)
    └── upload_file.py     # Gemini Files API helper (from the original)
```

MIT licensed, same as the original.
