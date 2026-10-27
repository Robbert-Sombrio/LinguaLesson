"""Remove "last week" after "headline" (2.70-3.37 s in voice-final.wav) so the Short stays evergreen.
The "n" of "headline" fades over 100 ms so the word ends like the end of a sentence."""
import sys, wave
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
A, B = 2.70, 3.37
w = wave.open(src)
sr, ch = w.getframerate(), w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32)
w.close()
fade_out, fade_in = int(0.10 * sr), int(0.012 * sr)
a, b = int(A * sr), int(B * sr)
head, tail = x[:a].copy(), x[b:].copy()
head[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 1.5
tail[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
y = np.concatenate([head, tail])
with wave.open(dst, "wb") as o:
    o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr)
    o.writeframes(np.clip(y, -32768, 32767).astype(np.int16).tobytes())
print(f"removed {B - A:.2f}s -> {len(y) / sr:.2f}s")
