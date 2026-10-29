# Build timeline.json from the narration's word timings (voice/take1.words.json):
# subtitle cues, chapter starts and hit marks. The music grid (96 bpm) is anchored at 0;
# chapter cuts are quantised to eighths. Word indices are for take 1.
import json, os, re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import difflib
H = json.load(open(f"{HERE}/voice/take1.words.json"))
# on-screen words come from the script (voice/display.txt, numbers as digits); times come from whisper
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
D = open(f"{HERE}/voice/display.txt").read().split()
sm = difflib.SequenceMatcher(None, [norm(x) for x in D], [norm(h["w"]) for h in H], autojunk=False)
W = []
for op, a0, a1, b0, b1 in sm.get_opcodes():
    if op in ("equal", "replace") and a1 - a0 == b1 - b0:
        W += [dict(w=D[a0 + k], t0=H[b0 + k]["t0"], t1=H[b0 + k]["t1"]) for k in range(a1 - a0)]
    elif a1 > a0:
        T0, T1 = (H[b0]["t0"], H[b1 - 1]["t1"]) if b1 > b0 else (H[b0 - 1]["t1"], H[b0 - 1]["t1"])
        n = a1 - a0
        W += [dict(w=D[a0 + k], t0=T0 + (T1 - T0) * k / n, t1=T0 + (T1 - T0) * (k + 1) / n) for k in range(n)]
assert len(W) == len(D), (len(W), len(D))
GAP_AT, GAP = 373, 1.6          # silence inserted before "The silence did the work."
for i, w in enumerate(W):
    if i >= GAP_AT:
        w["t0"] += GAP; w["t1"] += GAP
    w["t0"], w["t1"] = round(w["t0"], 3), round(w["t1"], 3)
EIGHTH = 60 / 96 / 2
q = lambda t: round(round(t / EIGHTH) * EIGHTH, 4)
t = lambda i: W[i]["t0"]

# chapter n starts a little before its "Number" (chapter 5 before "And its partner")
CH_AT = {1: 51, 2: 84, 3: 126, 4: 171, 5: 182, 6: 243, 7: 301, 8: 333, 9: 378}
CH = [dict(n=n, t=q(t(i) - 0.4)) for n, i in CH_AT.items()]
RECAP, OUTRO, LAST = 412, 435, len(W) - 1
END = q(W[LAST]["t1"] + 0.9)                 # end card starts
DUR = round(END + 15.0, 3)                   # 15 s end card: room for YouTube end-screen elements

M = {  # hit marks (seconds)
    "leans": t(16), "title": t(18), "nine": t(36),
    "term1": t(53), "term2": t(86), "lands": t(116), "survive": t(123),
    "term3": t(128), "collapses": t(147), "term4": t(173), "term5": t(187),
    "term6": t(245), "within": t(275), "term7": t(303), "conclusion": t(316),
    "term8": t(335), "realizes": t(369), "device": t(372), "silence": t(GAP_AT),
    "silence_start": W[GAP_AT - 1]["t1"], "term9": t(380),
    "recap": q(t(RECAP) - 0.3), "outro": q(t(OUTRO) - 0.3), "learnable": t(453), "end": END,
}
M["recap_terms"] = [t(i) for i in (413, 414, 415, 418, 421, 425, 427, 431, 434)]

# subtitle cues: sentences, long ones split at commas, merged forward until each is held >= 1.8 s
sents, cur = [], []
for i, w in enumerate(W):
    cur.append(i)
    if re.search(r"[.?!:]\"?$", w["w"]) or i == LAST:
        sents.append(cur); cur = []
def split(c):
    if len(c) <= 11: return [c]
    mid = len(c) / 2
    commas = [k + 1 for k in range(3, len(c) - 4) if W[c[k]]["w"].endswith(",")]
    k = min(commas, key=lambda k: abs(k - mid)) if commas else int(mid)
    return split(c[:k]) + split(c[k:])
cues = [p for c in sents for p in split(c)]
# a cue shown < 1.8 s takes the next one in, unless the next starts a chapter or the recap
keep = set(CH_AT.values()) | {RECAP, OUTRO}
merged = [list(c) for c in cues]
k = 0
while k < len(merged) - 1:
    nxt = merged[k + 1]
    if t(nxt[0]) - t(merged[k][0]) < 1.8 and nxt[0] not in keep and len(merged[k]) + len(nxt) <= 16:
        merged[k] += merged.pop(k + 1)
    else:
        k += 1
CUES = []
for k, c in enumerate(merged):
    t0 = t(c[0])
    nxt = t(merged[k + 1][0]) if k + 1 < len(merged) else END
    t1 = max(min(nxt, W[c[-1]]["t1"] + 2.5), t0 + 1.8, W[c[-1]]["t1"] + 0.6)
    t1 = min(t1, nxt) if k + 1 < len(merged) else t1
    CUES.append(dict(t0=t0, t1=round(t1, 3), words=[dict(w=W[i]["w"], t0=t(i)) for i in c]))

json.dump(dict(dur=DUR, gap=dict(at=W[GAP_AT - 1]["t1"], len=GAP), ch=CH, m=M, cues=CUES, words=W),
          open(f"{HERE}/timeline.json", "w"), indent=1)
json.dump([dict(t0=c["t0"], t1=c["t1"], text=" ".join(x["w"] for x in c["words"])) for c in CUES],
          open(f"{HERE}/cues.json", "w"), indent=1)
short = [c for c in CUES if c["t1"] - c["t0"] < 1.8]
print("dur", DUR, "cues", len(CUES), "short", len(short), "chapters", [c["t"] for c in CH])
