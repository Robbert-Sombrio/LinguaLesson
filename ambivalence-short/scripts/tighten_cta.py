"""Shorten the pauses inside the closing "Follow and subscribe..." line.
Each gap (start, end, keep) is measured silence in voice-final.wav; only its middle is removed."""
import sys, wave
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
GAPS = [
    (46.52, 46.80, 0.08),   # for ... more
    (47.36, 47.62, 0.06),   # English ... tips
    (48.12, 48.30, 0.06),   # tips ... and
    (48.82, 49.02, 0.05),   # and ... vocabulary
]
w = wave.open(src)
sr, ch = w.getframerate(), w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32)
w.close()
fade = int(0.008 * sr)
parts, cursor = [], 0
for a, b, keep in GAPS:
    mid = (a + b) / 2
    cut_a, cut_b = int((mid - keep / 2) * sr), int((mid + keep / 2) * sr)
    cut_a, cut_b = int(a * sr) + (cut_a - int(a * sr)), cut_b
    # remove everything between a+keep/2 and b-keep/2
    ra, rb = int((a + keep / 2) * sr), int((b - keep / 2) * sr)
    seg = x[cursor:ra].copy()
    seg[-fade:] *= np.linspace(1, 0, fade)[:, None]
    parts.append(seg)
    cursor = rb
    nxt = x[cursor:cursor + fade]
    x[cursor:cursor + fade] = nxt * np.linspace(0, 1, fade)[:, None]
parts.append(x[cursor:])
y = np.concatenate(parts)
with wave.open(dst, "wb") as o:
    o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr)
    o.writeframes(np.clip(y, -32768, 32767).astype(np.int16).tobytes())
removed = sum(b - a - k for a, b, k in GAPS)
print(f"removed {removed:.2f}s -> {len(y) / sr:.2f}s")
