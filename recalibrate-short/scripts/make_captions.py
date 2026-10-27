"""Write compositions/captions.html from assets/audio/words.json (word-level timings)."""
import json, html

words = json.load(open("assets/audio/words.json"))
words = words if isinstance(words, list) else words["words"]
HIDE = [(5.6, 8.4), (11.3, 14.6), (16.5, 20.4), (30.0, 99)]   # the same words are already on screen
MAXW = 5

# split at punctuation, then cut long phrases into even chunks of at most MAXW words
phrases, cur = [], []
for w in words:
    cur.append(w)
    if w["text"][-1] in ".,?!:":
        phrases.append(cur); cur = []
if cur:
    phrases.append(cur)
groups = []
for ph in phrases:
    n = -(-len(ph) // MAXW)
    size = -(-len(ph) // n)
    groups += [ph[i:i + size] for i in range(0, len(ph), size)]

def hidden(g):
    mid = (g[0]["start"] + g[-1]["end"]) / 2
    return any(a <= mid < b for a, b in HIDE)

groups = [g for g in groups if not hidden(g)]
rows, tweens = [], []
for gi, g in enumerate(groups):
    start = max(0.0, g[0]["start"] - 0.08)
    end = g[-1]["end"] + 0.25
    if gi + 1 < len(groups):
        end = min(end, groups[gi + 1][0]["start"] - 0.08)
    spans = []
    for wi, w in enumerate(g):
        wid = f"cap-{gi}-{wi}"
        spans.append(f'<span id="{wid}">{html.escape(w["text"])}</span>')
        tweens.append(f'tl.fromTo("#{wid}", {{ backgroundSize: "0% 100%" }}, {{ backgroundSize: "100% 100%", duration: 0.12, ease: "none" }}, {w["start"]:.3f});')
    rows.append(f'    <div id="cap-{gi}" class="clip cap" data-start="{start:.3f}" data-duration="{end - start:.3f}">{" ".join(spans)}</div>')
    tweens.append(f'tl.fromTo("#cap-{gi}", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.14, ease: "power2.out" }}, {start:.3f});')

page = f'''<template>
  <style>
    #root {{ position: absolute; inset: 0; }}
    .cap {{ position: absolute; left: 70px; right: 70px; top: 1190px; text-align: center; font-family: "Inter", sans-serif; font-size: 50px; font-weight: 700; line-height: 1.3; color: #2e3642; }}
    .cap span {{ display: inline-block; padding: 0 6px; border-radius: 6px; background-image: linear-gradient(#e3a728cc, #e3a728cc); background-repeat: no-repeat; background-position: left 80%; background-size: 0% 100%; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="1080" data-height="1920">
{chr(10).join(rows)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {chr(10).join("    " + t for t in tweens).lstrip()}
    window.__timelines["captions"] = tl;
  </script>
</template>
'''
open("compositions/captions.html", "w").write(page)
print(len(groups), "caption groups")
for g in groups:
    print(f'{g[0]["start"]:6.2f}  {" ".join(w["text"] for w in g)}')
