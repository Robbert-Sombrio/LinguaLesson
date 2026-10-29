# Fluent Edge Swiss: the first film

One example among many. Don't reuse its story, arc, shots, props or timings.

Film: *Executive presence: 9 words and phrases* (3:23) · `test.mp4` · source in [`demo/`](demo/)

## Story
A vocabulary film for The Fluent Edge. A grid of slate dots is a meeting room; one coral dot (presence) walks in off-grid and the room leans toward it. Nine chapters follow, one term each, as a spread: giant sky numeral on the left page, term with the coral dot as its full stop on the right, a meaning line, a caption row with the real-world source, and one small artefact. Recap on a 3×3 wall, outro "Pick one / this week", end card for Sean Watson and Dr. Howie Jacobson.

## What each change looks like on screen
| Change | Where to see it |
|---|---|
| Mist paper, ink and slate type | every frame |
| Sky for giant numerals and unspoken items | chapter numerals; the recap wall before each term is spoken |
| Blue only for caption rows and notes | header, eyebrows, caption rows |
| Coral, one element at a time | the dot: walks into the room (0:01), is every term's full stop, glides across the split frame (1:37), lands on the silence (2:38), reads the recap wall |
| DM Sans | everything |

## Shots and moves
Push-in on the room · hard pans by one page between chapters · split frame (chapters 4–5) · knife cuts (engines, Wi-Fi bars, "Trust the system", a quarter of the staff, the wall) · re-flow (the room leans; BLUF's answer rises) · extreme scale (155 counter, 90 seconds) · pull-out to a wall of artefacts (recap).

## Score
96 bpm, synthesised in `mix.py`: vibraphone pulse (intro) → marimba ostinato in eighths over Am–F–C–G + felt kick → a second marimba line a fifth up and an off-beat hat → vibraphone only → hard stop and true silence → half-time marimba ("Measured") → full ostinato → one vibraphone chord ringing out under the end card. Dry print foley from `events.json`.

## Build notes
- `film.js` draws everything (`render(t)`, `EV`); `index.html` loads it with DM Sans from `fonts/`.
- `tools/build_timeline.py` aligns the script (`voice/display.txt`) to Whisper word times (`voice/take1.words.json`), inserts the 1.6 s silence, writes `timeline.json` (cues, chapters, marks) and `cues.json`.
- `mix.py` builds score, foley and voice into `out/mix.wav`; `tools/master.sh` does two-pass loudnorm on the audio alone (ffmpeg 6.x safe) and muxes.
- `build.sh` rebuilds into `$OUT` without touching `demo/`. Narration: ElevenLabs "Brian" (premade), take 1.
- `?base=1` renders the same frame in the base Swiss palette and Inter, for comparison.
