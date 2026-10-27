"""Write renders/ambivalence-short.srt from assets/audio/words.json (timings checked against the final audio)."""
import json

words = json.load(open("assets/audio/words.json"))
words = words if isinstance(words, list) else words["words"]

# Cue text, in order; each cue takes the next N words from the transcript.
CUES = [
    (6, "Harvard Business Review published this headline."),
    (7, "Most people can't pronounce the key word."),
    (2, "The headline:"),
    (9, '"Leaders Need to Grapple with\nEmployee Ambivalence on AI."'),
    (4, "The word is ambivalence."),
    (6, "It means you feel two conflicting"),
    (5, "things at the same time."),
    (8, "Employees are excited about AI\nsaving them time"),
    (6, "and terrified it will replace them."),
    (4, "That's ambivalence, not confusion."),
    (7, "Two strong feelings pulling\nin opposite directions."),
    (5, "Next time a colleague says,"),
    (6, '"I have mixed feelings about this,"'),
    (5, 'you can say: "That\'s ambivalence.'),
    (2, "It's normal."),
    (5, 'Let\'s talk through both sides."'),
    (1, "Ambivalence: am-BIV-uh-lens."),
    (5, "Stress on the second syllable."),
    (3, "Follow and subscribe"),
    (6, "for more English tips and vocabulary."),
]
assert sum(n for n, _ in CUES) == len(words), (sum(n for n, _ in CUES), len(words))

def ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

out, i = [], 0
spans = []
for n, text in CUES:
    g = words[i:i + n]; i += n
    spans.append([g[0]["start"], g[-1]["end"], text])
for k, sp in enumerate(spans):
    start = max(0.0, sp[0] - 0.05)
    end = sp[1] + 0.35
    if k + 1 < len(spans):
        end = min(end, spans[k + 1][0] - 0.06)
    end = max(end, start + 0.8)
    out.append(f"{k + 1}\n{ts(start)} --> {ts(end)}\n{sp[2]}\n")
open("renders/ambivalence-short.srt", "w").write("\n".join(out))
print("\n".join(out))
