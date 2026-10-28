"""Write index.html for one platform version. Scene starts/durations come from timing.json (written by
scripts/retime.py once the voice is in; estimates until then)."""
import json, sys

platform = sys.argv[1] if len(sys.argv) > 1 else "youtube"
CTA = {
    "youtube":   {"cta": "More words like this", "button": "Subscribe", "done": "Subscribed ✓"},
    "tiktok":    {"cta": "Comment NEXT for the next word", "button": "Follow", "done": "Following ✓"},
    "instagram": {"cta": "Save this for your next meeting", "button": "Follow", "done": "Following ✓"},
    "linkedin":  {"cta": "More workplace vocabulary", "button": "Follow", "done": "Following ✓"},
}
HANDLES = {"youtube": "@fluentedgepodcast", "tiktok": "@thefluentedge", "instagram": "@thefluentedgepod", "linkedin": "@fluentedgepodcast"}
t = json.load(open("timing.json"))
total = t["total"][platform]
scenes = [("frame", 0, total, 1), ("hook", *t["hook"], 2), ("swap", *t["swap"], 2), ("compare", *t["compare"], 2),
          ("endcard", t["endcard_start"], total - t["endcard_start"], 3), ("captions", 0, total, 4)]
hosts = []
for i, (cid, st, du, z) in enumerate(scenes):
    if cid == "endcard" and platform == "linkedin":
        cid = "endcard-linkedin"   # every LinkedIn post ends on Sean's personal card
    kind = "captions" if cid == "captions" else "graphics"
    extra = ""
    if cid == "endcard":
        vals = dict(CTA[platform], handle=HANDLES[platform])
        extra = " data-variable-values='" + json.dumps(vals, ensure_ascii=False) + "'"
    hosts.append(f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{st}" data-duration="{round(du, 3)}"\n'
                 f'        data-track-index="{i + 1}" data-track-kind="{kind}" data-width="1080" data-height="1920" style="z-index: {z}"{extra}></div>')
voice = f"assets/audio/voice-{platform}.wav"
page = f'''<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #eeeae1; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1080" data-height="1920">
{chr(10).join(hosts)}
      <audio id="voice" class="clip" src="{voice}" data-start="0" data-duration="{t['voice'][platform]}" data-track-index="10" data-volume="1.15"></audio>
      <audio id="bed" class="clip" src="assets/audio/bed-{platform}.wav" data-start="0" data-duration="{total}" data-track-index="11" data-volume="1"></audio>
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
'''
open("index.html", "w").write(page)
print("index.html ->", platform, total, "s")
