"""Shorten pauses in the voice track: any silence over MAX_GAP becomes KEEP seconds."""
import subprocess, sys, wave, re
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
SR = 48000
THRESH_DB, MIN_SIL = -38, 0.4
KEEP, LEAD, TAIL = float(__import__("os").environ.get("KEEP", 0.32)), 0.12, 0.3

pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
det = subprocess.run(["ffmpeg", "-i", src, "-af", f"silencedetect=n={THRESH_DB}dB:d={MIN_SIL}", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
starts = [float(v) for v in re.findall(r"silence_start: ([\d.]+)", det)]
ends = [float(v) for v in re.findall(r"silence_end: ([\d.]+)", det)]
dur = len(x) / SR
if len(ends) < len(starts):
    ends.append(dur)

keep, cursor, cuts = [], 0.0, []
for s, e in zip(starts, ends):
    if s <= 0.01:
        a, b = s, max(s, e - LEAD)            # leading silence
    elif e >= dur - 0.01:
        a, b = min(e, s + TAIL), e            # trailing silence
    else:
        half = KEEP / 2
        a, b = s + half, e - half
    if b > a:
        keep.append((cursor, a))
        cuts.append((round(a, 3), round(b, 3)))
        cursor = b
keep.append((cursor, dur))

fade = int(0.01 * SR)
parts = []
for a, b in keep:
    seg = x[int(a * SR):int(b * SR)].copy()
    if len(seg) > 2 * fade:
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
    parts.append(seg)
y = np.concatenate(parts)
with wave.open(dst, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
print(f"in {dur:.2f}s -> out {len(y)/SR:.2f}s, {len(cuts)} pauses shortened")
