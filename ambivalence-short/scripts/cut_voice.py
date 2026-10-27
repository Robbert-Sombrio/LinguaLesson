"""Remove whole lines from the voice, snap each cut to the quietest nearby point,
speed the result up slightly, and remap the word timings to match."""
import json, subprocess, sys, wave
import numpy as np

src_wav, src_words, dst_wav, dst_words = sys.argv[1:5]
SR = 48000
SPEED = 1.07
# (start, end) seconds to remove, from the transcript; edges are refined below
# Each edge: (time, search span). Spans stay inside the gap between words.
REMOVE = [
    ((15.50, 0.08), (17.30, 0.10)),   # "It doesn't mean you don't care."
    ((21.30, 0.10), (23.62, 0.10)),   # long pause after "...at the same time."
    ((32.31, 0.06), (33.84, 0.06)),   # "Not indifference."
    ((49.60, 0.07), (54.29, 0.08)),   # "One word, senior register, instant clarity. Ambivalence."
]

with wave.open(src_wav) as w:
    assert w.getframerate() == SR and w.getnchannels() == 1
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768

win = int(0.02 * SR)
rms = np.sqrt(np.convolve(x * x, np.ones(win) / win, mode="same"))

def quiet(t, span=0.12):
    a, b = int((t - span) * SR), int((t + span) * SR)
    return (a + int(np.argmin(rms[a:b]))) / SR

cuts = [(quiet(*a), quiet(*b)) for a, b in REMOVE]
fade = int(0.015 * SR)
out, cursor = [], 0.0
for a, b in cuts + [(len(x) / SR, None)]:
    seg = x[int(cursor * SR):int(a * SR)].copy()
    seg[:fade] *= np.linspace(0, 1, fade)
    seg[-fade:] *= np.linspace(1, 0, fade)
    out.append(seg)
    cursor = b if b is not None else cursor
y = np.concatenate(out)

tmp = dst_wav + ".tmp.wav"
with wave.open(tmp, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", f"atempo={SPEED}", dst_wav], check=True)
subprocess.run(["rm", tmp])

def remap(t):
    shift = 0.0
    for a, b in cuts:
        if t >= b:
            shift += b - a
        elif t > a:
            return None
    return (t - shift) / SPEED

words = json.load(open(src_words))
words = words if isinstance(words, list) else words["words"]
kept = []
for wd in words:
    s, e = remap(wd["start"] + 0.02), remap(wd["end"] - 0.02)
    if s is not None and e is not None:
        kept.append({"text": wd["text"], "start": round(s, 3), "end": round(e + 0.02 / SPEED, 3)})
json.dump(kept, open(dst_words, "w"), indent=1)
print("cuts", [(round(a, 2), round(b, 2)) for a, b in cuts])
print(f"duration {len(y) / SR / SPEED:.2f}s, {len(kept)} words kept")
