"""Build the 30-second voice track from the 50-second one (voice-final.wav of ambivalence-short):
hook, pronunciation, meaning, AI example, workplace line. Cut points sit in measured silence."""
import json, sys, wave
import numpy as np

src_wav, src_words, dst_wav, dst_words = sys.argv[1:5]
# (source start, source end, gap after) in seconds of the 50 s voice track
SEGMENTS = [
    (0.00, 5.40, 0.30),    # Harvard Business Review published this headline. Most people can't pronounce the key word.
    (40.58, 43.70, 0.30),  # Ambivalence. Stress on the second syllable.
    (14.08, 17.66, 0.25),  # It means you feel two conflicting things at the same time.
    (17.86, 23.86, 0.45),  # Employees are excited about AI saving them time and terrified it will replace them.
    (30.26, 38.00, 0.00),  # Next time a colleague says, "I have mixed feelings about this," you can say: "That's ambivalence. It's normal."
]
# Word indexes (into the 50 s transcript) for each segment, and waveform-measured timings where the
# transcript drifted (source seconds).
WORD_RANGES = [(0, 12), (87, 92), (28, 38), (39, 52), (64, 81)]
MEASURED = {
    28: (14.16, 14.26), 29: (14.26, 14.60), 30: (14.62, 14.72), 31: (14.74, 15.14), 32: (15.20, 15.48),
    33: (15.52, 16.20), 34: (16.28, 16.48), 35: (16.48, 16.56), 36: (16.56, 16.66), 37: (16.66, 16.92),
    38: (16.94, 17.56), 87: (40.64, 41.66), 88: (41.94, 42.46), 39: (17.90, 18.51),
}

w = wave.open(src_wav)
sr, ch = w.getframerate(), w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32)
w.close()
words = json.load(open(src_words))
words = words if isinstance(words, list) else words["words"]

fade = int(0.012 * sr)
parts, out_words, cursor = [], [], 0.0
for (a, b, gap), (i0, i1) in zip(SEGMENTS, WORD_RANGES):
    seg = x[int(a * sr):int(b * sr)].copy()
    seg[:fade] *= np.linspace(0, 1, fade)[:, None]
    seg[-fade:] *= np.linspace(1, 0, fade)[:, None]
    parts += [seg, np.zeros((int(gap * sr), ch), dtype=np.float32)]
    for i in range(i0, i1 + 1):
        s, e = MEASURED.get(i, (words[i]["start"], words[i]["end"]))
        s, e = max(s, a), min(e, b)
        out_words.append({"text": words[i]["text"], "start": round(s - a + cursor, 3), "end": round(e - a + cursor, 3)})
    cursor += (b - a) + gap
y = np.concatenate(parts)
with wave.open(dst_wav, "wb") as o:
    o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr)
    o.writeframes(np.clip(y, -32768, 32767).astype(np.int16).tobytes())
json.dump(out_words, open(dst_words, "w"), indent=1)
print(f"{len(y) / sr:.2f}s, {len(out_words)} words")
