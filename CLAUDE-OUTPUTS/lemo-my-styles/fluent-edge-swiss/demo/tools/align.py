# Transcribe a narration take with faster-whisper, save word timings, and score it against the script text.
import sys, json, re, difflib
from faster_whisper import WhisperModel
wav, script_txt, out = sys.argv[1], sys.argv[2], sys.argv[3]
norm = lambda s: re.sub(r"[^a-z0-9' ]", " ", s.lower().replace("-", " ")).split()
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(wav, word_timestamps=True, language="en", beam_size=5)
words = [dict(w=w.word.strip(), t0=round(w.start, 3), t1=round(w.end, 3)) for s in segs for w in s.words]
json.dump(words, open(out, "w"), indent=0)
heard = norm(" ".join(w["w"] for w in words)); want = norm(open(script_txt).read())
sm = difflib.SequenceMatcher(None, want, heard, autojunk=False)
print(out, "ratio %.4f" % sm.ratio(), "words", len(heard), "/", len(want))
for op, a0, a1, b0, b1 in sm.get_opcodes():
    if op != "equal": print(" ", op, " ".join(want[a0:a1]), "->", " ".join(heard[b0:b1]))
