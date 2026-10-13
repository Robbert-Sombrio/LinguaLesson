---
name: collage-broll
description: Turn a ~5 second voiceover line, opinion, or abstract idea into a premium editorial halftone paper-collage B-roll clip (9:16, 5s, silent MP4) that assembles itself from an empty colour field. Use whenever the user says "collage b-roll", "paper collage b-roll", "halftone collage", "collage-style visual for this line", "make a collage animation from this script", or wants a script line turned into a collage visual metaphor. Runs a mandatory three-gate approval flow: metaphor only first; after approval, still frames via ElevenLabs image generation; after a second approval, a first/last-frame assembly animation via Gemini Omni Flash (gemini-omni-flash-preview). Requires the ElevenLabs connector, GEMINI_API_KEY, Python 3.10+, and ffmpeg.
---

# Collage B-roll

Squeeze one ~5 second voiceover line into one sharp visual idea, then turn it into a premium editorial paper-collage animation that assembles itself piece by piece.

Pipeline:

1. Design the visual metaphor only. Stop and wait for approval.
2. Generate the still frame only (ElevenLabs). Stop and wait for approval.
3. Generate the video with Gemini Omni Flash and run QA.

The two approval gates are the point of this skill. They keep the user's attention on taste and direction, and they stop a weak metaphor or a bad still from burning video-generation money.

`<skill dir>` below means the folder this SKILL.md lives in.

## First run: environment check

Every time the skill triggers, before Gate 1, run:

```bash
bash <skill dir>/scripts/check_setup.sh
```

Then confirm the ElevenLabs image tool is reachable: load `creative_generate_image` from the ElevenLabs connector via ToolSearch (query `elevenlabs generate image`). Do not generate anything yet.

If everything passes, go straight to Gate 1 without repeating setup info. If anything fails, treat it as a first run: do not start Gate 1. Show the user only the fixes for what's missing (below), then re-run the check once they say it's done.

### Setup fixes (show only the missing ones)

1. **GEMINI_API_KEY not set.** Create a key at [Google AI Studio](https://aistudio.google.com/apikey), then:

   ```bash
   echo 'export GEMINI_API_KEY="your-key"' >> ~/.zshrc && source ~/.zshrc
   ```

   Video generation is billed per clip to the Google account that owns this key.

2. **ffmpeg / ffprobe missing.** macOS: `brew install ffmpeg`. Debian/Ubuntu: `sudo apt install ffmpeg`.

3. **Python missing or older than 3.10.** macOS: `brew install python3`, or install from python.org.

4. **Shared venv missing** (google-genai >= 2.10.0). Ask the user's permission once, then create it yourself:

   ```bash
   python3 -m venv ~/collage-broll-projects/.omni-venv
   ~/collage-broll-projects/.omni-venv/bin/python -m pip install --upgrade "google-genai>=2.10.0" "httpx[socks]"
   ```

5. **ElevenLabs connector not available.** Tell the user to connect or re-authorize ElevenLabs in their claude.ai connector settings. Until then, Gate 2 can't generate stills; the user can supply their own 9:16 still images instead and continue from Gate 2 approval.

## Mandatory approval protocol

### Gate 1: metaphor approval

After receiving the script line(s), propose metaphors only. No images, no video, no model calls.

For each line deliver:

- Core meaning
- Mood
- One-sentence visual proposition
- 3 to 6 key objects
- Background colour and accent colours
- Expected assembly order

Then stop and wait for "yes", "approved", "all approved", or per-item revisions.

If the user approves only some numbers, only those items move to Gate 2. The rest stay at Gate 1 for revision.

### Gate 2: still-frame approval

Only after metaphor approval: write the visual spec and image prompt, then generate the stills with ElevenLabs (details in Phase 2).

Save the chosen image into the project folder, build a numbered contact sheet, show it to the user, and stop again. No Omni Flash call and no video at this stage.

If the user approves only some stills, only those move to Gate 3. Regenerate and re-confirm the others.

### Gate 3: video generation

Once stills are approved, don't ask which video model to use. Run the bundled `scripts/generate_video.py`, which defaults to:

```text
gemini-omni-flash-preview
```

Only switch models if the user explicitly names another one.

## What success looks like

- One line expresses one clear metaphor
- A batch shares one design language, with different background colours where the meaning calls for it
- Background is a bold, flat, even colour field
- The skeleton of each frame is black-and-white halftone photographic cut-outs
- Key cards, buttons, film strips, rulebooks etc. may use coloured paper: red, yellow, teal, orange, purple, cream
- Every paper piece has crisp cut edges, a cream keyline, a soft low-opacity shadow, and paper grain
- Motion is assemble-from-empty: pieces slide in and snap into place, never a gentle drift, wobble, or slow zoom
- No captions, no script text, no logos, no watermark, no UI
- Default delivery: 9:16, 5 seconds, 720×1280, 24fps, silent MP4

## When not to use this skill

- The user needs exact control over layers, occlusion, camera moves, or an editable timeline. Use a layered animation tool instead.
- The user only wants a video prompt, not a finished clip. Just write the prompt.
- Real people, real product ads, or an on-camera presenter. This collage flow is the wrong fit.
- The user wants separate transparent layers. This skill doesn't split layers.

## Project folder

Use the user's local date:

```text
~/collage-broll-projects/YYYY-MM-DD-collage-broll-<short-title>/
```

Recommended batch structure:

```text
<project>/
├── brief.md
├── visual-spec.json
├── image-prompts.md
├── omni-jobs.json
├── gate2-qa.md
├── gate3-qa.md
├── still-contact-sheet.jpg
├── omni-contact-sheet-all.jpg
├── video-first-frame-all.jpg
├── end-frame-comparison-all.jpg
├── 01-<concept>/
│   ├── omni-prompt.txt
│   ├── frames/
│   │   ├── variations/          # all ElevenLabs variations, a.png b.png ...
│   │   ├── last-frame-original.png
│   │   ├── first-frame.png
│   │   └── last-frame.png
│   └── omni/run-v01/
│       ├── final-5s.mp4
│       ├── final-5s-noaudio.mp4
│       ├── contact-sheet.jpg
│       ├── video-last-frame.jpg
│       └── end-frame-comparison.jpg
└── 02-<concept>/...
```

## Phase 1: design the visual metaphor

Compress the line into one visual proposition.

Extract:

- Core meaning: what the viewer must understand by the end
- Mood: calm, surprised, urgent, sudden clarity, absurd, ironic
- Action verb: open, connect, leak, bind, file, light up, compress, fork, assemble
- Visual metaphor: machine, clock, film strip, filing cabinet, control panel, rulebook, funnel, track, chess piece

Never put the script's words into the image. One line gets one metaphor with 3 to 6 key objects. More objects weaken the meaning and make Omni's assembly unstable.

In a batch, give the metaphors a story arc. For example: first show manual effort and lost experience, then show rules settling into a system and a human/AI division of labour.

### Gate 1 output example

```text
1. Core meaning: experience gets used up again and again
   Metaphor: a skilled editor trims frame by frame around a giant film-strip clock; a full turn of the clock yields only a tiny piece of finished film
   Key objects: film-strip clock, editor, scissors, short film strip
   Colour: burnt-orange field, cream and pale-teal accents
   Assembly order: clock → editor with scissors → film strip → tiny finished output
```

Then stop and wait.

## Phase 2: generate the colour collage still (ElevenLabs)

After metaphor approval, write a self-contained `visual-spec.json`, then the image prompt.

### Visual spec

```json
{
  "script_meaning": "",
  "visual_metaphor": "",
  "style_signature": "flat bold color field, mixed black-and-white halftone cut-outs and colored cardstock accents, crisp cut edges, cream keylines, soft paper shadows, editorial paper collage",
  "aspect_ratio": "9:16",
  "color_field": {
    "background_hex": "",
    "accent_colors": [],
    "paper_grain": "fine uncoated-paper fiber"
  },
  "elements": [
    {
      "what": "",
      "role": "",
      "motion": "",
      "placement": ""
    }
  ],
  "composition": {
    "layout": "",
    "negative_space": "",
    "final_frame": ""
  },
  "motion_plan": "structure first, subject or cards second, action and result last",
  "avoid": "typography, readable letters, numerals, logos, watermark, UI, subtitles, glossy 3D, photoreal environment"
}
```

### Colour rules

Don't default to cobalt blue. Pick a bold field that fits the meaning, and keep a batch on one design language with different fields:

- Burnt orange / red: time spent, labour, urgency
- Mustard yellow: tools, warnings, lost experience
- Deep green: cognition, taste, system reset
- Deep purple: rules, things settling, long-term memory
- Teal: judgement, collaboration, automation

Subjects stay mostly black-and-white halftone. Coloured paper must carry information hierarchy, never colour for its own sake.

### Step 1: make the blank 9:16 colour card

The image model is unreliable at 9:16 from the prompt alone, but it follows the shape of a reference image. So build the empty first frame now and use it as the reference. This also guarantees the still's background matches the video's empty opening frame.

```bash
bash <skill dir>/scripts/prep_frames.sh blank <item> <HEX-without-#>
```

This writes `<item>/frames/first-frame.png` (1080×1920, flat colour).

### Step 2: put the card on an ElevenLabs flow

1. `creative_create_flow` once per project. Reuse that `flow_id` for every item in the batch.
2. Upload the blank card: `creative_create_asset_upload` with name, `image/png`, and the exact byte size (`stat -f%z` on macOS, `stat -c%s` on Linux). PUT the bytes to the returned `upload_url` with curl (`curl -X PUT -H "Content-Type: image/png" --data-binary @<file> "<upload_url>"`). Then `creative_finalize_asset_upload` with the `asset_id` and `flow_id`. Keep the returned `node_id`. Never invent a node_id.

### Step 3: generate

Call `creative_generate_image` with:

- `model_id`: `gemini-3-pro-image` (Nano Banana Pro), unless the user names another
- `flow_id`: the project flow
- `connect_from`: [the blank card's `node_id`]
- `generations_count`: leave at the default (4 variations to choose from)
- `prompt`: the template below

Never call `creative_generate_image` twice to retry; that charges a second run. Poll `creative_get_flow_run_status` with the returned `flow_id` and `session_ids`, waiting `poll_after_seconds` between calls, until `all_completed` or `has_failures`.

Prompt template (narrative sentences work better than keyword lists for this model):

```text
Using the attached reference: Reference 1 provides the exact vertical 9:16 canvas size and the exact flat [colour name] background colour [hex]. Do not change the input aspect ratio.

Create a finished premium editorial paper-collage poster on that flat [colour name] paper field with subtle uncoated paper fibre, expressing this idea: [one-sentence visual proposition].

The collage mixes black-and-white halftone photographic cut-outs with a few selective [accent colour] cardstock pieces. It is built from 3 to 6 large, clearly separate paper groups: [list the key objects and where each sits]. The main subject stays inside the middle 70 percent of the frame, with generous clean colour-field space around it.

Every piece shows visible printed halftone dots, crisp machine-cut edges, a thin warm-cream keyline, and a soft low-opacity physical drop shadow. The overall look is a locked, flat, stop-motion-ready paper collage photographed straight on.

The relationship that must read at a glance: [the one relationship this metaphor depends on].

The image contains no typography, letters, numbers, logos, watermark, UI or subtitles, and no glossy 3D or photoreal environment.
```

Log every prompt in `<project>/image-prompts.md`.

### Step 4: pull the images into the project

Read the generations from the final `creative_get_flow_run_status` result. Download each variation's image URL into `<item>/frames/variations/` as `a.png`, `b.png`, `c.png`, `d.png` (curl, or ffmpeg to convert if the file isn't PNG). If a result carries no downloadable URL, give the user the flow `url` and ask them to download the variations into that folder, then continue.

### Still-frame QA

Check each variation:

- Does the metaphor read at a glance?
- Is the subject concentrated?
- Any fake text, logo, watermark, or UI?
- Enough clean colour field left for an assemble-from-empty opening?
- 3 to 6 clear large groups, not confetti?
- Is the frame actually vertical? (check with `ffprobe`)
- Across a batch: consistent texture, varied colour?

Build a numbered contact sheet of all variations (labelled 1a, 1b, 2a ...):

```bash
bash <skill dir>/scripts/qa_sheets.sh stills <project> still-contact-sheet.jpg
```

Show it to the user with your QA notes and a recommended pick per item, then stop for Gate 2 approval. Write the QA verdicts to `<project>/gate2-qa.md`.

When the user picks (e.g. "1c, 2a"), copy that variation to `<item>/frames/last-frame-original.png`.

If the user asks for regenerations, make a new run on the same flow (pass `connect_from` again), save the new variations alongside the old ones (`e.png` onward), and write `still-contact-sheet-v2.jpg` (then v3, v4 ...). Never overwrite an older contact sheet.

If ElevenLabs keeps failing on one item, say so plainly. Don't silently swap providers.

## Phase 3: generate video with Omni Flash

### 1. Prepare first and last frames

```bash
bash <skill dir>/scripts/prep_frames.sh last <item>
```

This crops `last-frame-original.png` to an exact 1080×1920 `last-frame.png`. The first frame is the blank card from Phase 2. Only start from a non-empty frame if the user explicitly asks.

### 2. Write the Omni animation prompt

Default motion order:

```text
base structure → person or key cards → connectors → action → final result
```

Template:

```text
Paper-collage stop-motion assembly, using Image 1 as the exact empty first frame and Image 2 as the exact completed last frame. In one continuous locked-off vertical shot, open on the empty flat [color] paper field.

Assemble the scene piece by piece with crisp physical stop-motion timing: [describe, in order, how the 3 to 6 elements slide in, snap into place, connect, and complete the action]. End by holding the supplied completed composition.

Preserve the exact 9:16 framing, [hex] color field, colored cardstock accents, uncoated paper grain, halftone dots, cream keylines, crisp cut edges and soft shadows. Restrained tactile 2D paper craft only.

No scene cuts, no camera movement, no zoom, no morphing, no new objects, no text, no letters, no numbers, no logos, no watermark, no UI, no sound.
```

Every prompt must state that Image 1 is the empty first frame and Image 2 is the approved completed frame. The ending must match Image 2; don't let the model redesign it. Save each prompt to `<item>/omni-prompt.txt`.

### 3. Check the Omni runtime

Use the shared venv at `~/collage-broll-projects/.omni-venv/`. Reuse it if it exists; create it only if missing. Never create a per-project `.venv`, and never use `--break-system-packages`.

```bash
[ -x ~/collage-broll-projects/.omni-venv/bin/python ] || {
  python3 -m venv ~/collage-broll-projects/.omni-venv
  ~/collage-broll-projects/.omni-venv/bin/python -m pip install --upgrade "google-genai>=2.10.0" "httpx[socks]"
}
```

Confirm `GEMINI_API_KEY` is set, but never print or log its value.

### 4. Batch-call Gemini Omni Flash

Write `<project>/omni-jobs.json`, an array with one job per approved item:

```json
[
  {
    "prompt": "<omni prompt>",
    "image": [
      "<item>/frames/first-frame.png",
      "<item>/frames/last-frame.png"
    ],
    "output": "<item>/omni/run-v01/final-5s.mp4",
    "aspect_ratio": "9:16",
    "duration": 5
  }
]
```

Run:

```bash
~/collage-broll-projects/.omni-venv/bin/python \
  <skill dir>/scripts/generate_video.py \
  --batch <project>/omni-jobs.json \
  --concurrency 3
```

If you get a legacy Interactions API schema error, the wrong SDK is being used. Switch to the shared venv's python and retry. Don't fall back to Veo.

### 5. Strip audio and build QA images

Even with "no sound" in the prompt, always deliver a zero-audio-track file. For each run folder:

```bash
bash <skill dir>/scripts/qa_sheets.sh video <item>/omni/run-v01 <item>/frames/last-frame.png
```

This writes `final-5s-noaudio.mp4`, `contact-sheet.jpg` (one frame per second), `video-last-frame.jpg`, and `end-frame-comparison.jpg` (approved still beside the video's last frame), and prints the clip's size, fps, duration, and audio stream count. Keep the original `final-5s.mp4` as an intermediate.

For batches, also build the three overviews:

```bash
bash <skill dir>/scripts/qa_sheets.sh batch <project>
```

## Video QA

Look at the assembly, not only the last frame. Read the contact sheets yourself before reporting.

Pass criteria:

- First frame is close to an empty colour field. A sliver of paper at the edge is acceptable.
- The middle shows structure, people, or cards arriving one by one, not a whole-frame fade.
- No cuts, zoom, 3D look, or drift into a photoreal scene.
- No fake text, logo, watermark, or UI.
- Final frame matches the approved still. Small pose or detail drift (a slightly different posture, a small part added or missing) passes if the metaphor still reads. Don't re-run for that.
- Output is 720×1280, 24fps, 5 seconds, zero audio streams.

Write per-item verdicts (including any "passed with flaws" and why) to `<project>/gate3-qa.md`.

### Common problems

- Paper visible at the edge of frame 1: minor is fine. If the user needs a perfectly empty start, recommend fixing the opening in an editable animation tool.
- Weak assembly feel: cut the number of elements, and rewrite the prompt as an explicit piece-by-piece "slides in / snaps into place" sequence.
- Last-frame drift: strengthen "Image 2 is the exact completed last frame" and "End by holding the supplied completed composition".
- Fake text appears: go back and regenerate the still. Don't try to patch it in the video prompt.
- One video fails: re-run only that job. Never re-run items that already passed.

## Delivery

Give the user:

- Each `<item>/omni/run-v01/final-5s-noaudio.mp4`
- Each item's contact sheet
- The batch contact sheet
- The end-frame comparisons
- One sentence per line explaining how the script became that metaphor

If a flaw comes from Omni's speed/quality limits, say so directly. Only suggest a layered animation tool when the user truly needs precise layer control.
