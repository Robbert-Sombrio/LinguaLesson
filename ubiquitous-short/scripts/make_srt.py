"""Write renders/ubiquitous-<platform>.srt from assets/audio/words-<platform>.json."""
import json, sys

platform = sys.argv[1]
words = json.load(open(f"assets/audio/words-{platform}.json"))
words = words if isinstance(words, list) else words["words"]
FIX = {"recalibrate,": "recalibrate.", "next": "next"}
phrases, cur = [], []
for w in words:
    cur.append(w)
    if w["text"][-1] in ".,?!":
        phrases.append(cur); cur = []
if cur:
    phrases.append(cur)
cues = []
for ph in phrases:
    n = -(-len(ph) // 7); size = -(-len(ph) // n)
    cues += [ph[i:i + size] for i in range(0, len(ph), size)]

def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

def text(c):
    t = " ".join(w["text"] for w in c)
    t = t.replace("Comment next", "Comment NEXT").replace("the fluent edge", "The Fluent Edge").replace("the Fluent Edge", "The Fluent Edge")
    return t

out, prev_end, prev_text = [], 0.0, ""
for k, c in enumerate(cues):
    start = max(prev_end, c[0]["start"] - 0.05)
    end = c[-1]["end"] + 0.3
    if k + 1 < len(cues):
        end = min(end, cues[k + 1][0]["start"] - 0.05)
    t = text(c)
    if k == 0 or prev_text.endswith((".", "?", "!")):
        t = t[0].upper() + t[1:]
    if t.lower().startswith("ubiquitous") and k > 0 and text(cues[k - 1]).endswith("ubiquitous."):
        t = "yoo-BIK-wih-tus."   # the second, syllable-by-syllable "ubiquitous"
    end = max(end, start + 0.7)
    if k + 1 < len(cues):
        end = min(end, cues[k + 1][0]["start"] - 0.02)
    out.append(f"{k + 1}\n{ts(start)} --> {ts(end)}\n{t}\n")
    prev_end, prev_text = end, t
open(f"renders/ubiquitous-{platform}.srt", "w").write("\n".join(out))
print(platform, len(cues), "cues")
