"""Build voice-<platform>.wav: the boil-down-to take + the English Edge invite and that platform's "Link in..." tag
(both reused from the hegemony recording),
pauses tightened, 7% faster, loudness-normalised. Cut points sit in measured silence."""
import os, subprocess, sys, wave
import numpy as np

SRC = "assets/audio/src/recording.mp3"
CTA_SRC = "../hegemony-short/assets/audio/src/recording.mp3"   # English Edge invite + "Link in..." tags
SR = 48000
BODY = (1.3, 34.8)
ENDING = (39.0, 49.35)   # "If you're upper-intermediate ... Try it free for 7 days." in the hegemony take
BODY_CUTS = []
CTAS = {"youtube": (54.75, 56.40), "tiktok": (57.12, 58.45), "instagram": (57.12, 58.45), "linkedin": (59.06, 60.60)}
GAP_BEFORE_CTA = 0.40
SPEED = 1.10
TMP = sys.argv[1]

pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
cta_pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", CTA_SRC, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
cx = np.frombuffer(cta_pcm, dtype=np.int16).astype(np.float32) / 32768
fade = int(0.012 * SR)

def piece(a, b, src=None):
    s = (x if src is None else src)[int(a * SR):int(b * SR)].copy()
    s[:fade] *= np.linspace(0, 1, fade); s[-fade:] *= np.linspace(1, 0, fade)
    return s

def write(path, y):
    with wave.open(path, "wb") as o:
        o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR)
        o.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())

def tighten(src, dst):
    subprocess.run([sys.executable, "scripts/tighten_voice.py", src, dst], check=True, capture_output=True,
                   env=dict(os.environ, KEEP="0.26"))

# body with the two lines removed
parts, cur = [], BODY[0]
for a, b in BODY_CUTS:
    parts.append(piece(cur, a)); cur = b
parts.append(piece(cur, BODY[1]))
write(f"{TMP}/body-raw.wav", np.concatenate(parts))
tighten(f"{TMP}/body-raw.wav", f"{TMP}/body-tight.wav")
# polish the body take to match the (already polished) English Edge ending: EQ, de-ess, compression
CHAIN = open("scripts/polish_chain.txt").read().strip()
if False:  # Sean polished this take himself
  subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{TMP}/body-tight.wav", "-af", CHAIN, "-ar", str(SR), "-ac", "1",
                f"{TMP}/body-polished.wav"], check=True)
  os.replace(f"{TMP}/body-polished.wav", f"{TMP}/body-tight.wav")

for p, (a, b) in CTAS.items():
    write(f"{TMP}/cta-{p}-raw.wav", np.concatenate([piece(*ENDING, cx), np.zeros(int(0.35 * SR), dtype=np.float32), piece(a, b, cx)]))
    tighten(f"{TMP}/cta-{p}-raw.wav", f"{TMP}/cta-{p}-tight.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{TMP}/body-tight.wav", "-i", f"{TMP}/cta-{p}-tight.wav",
                    "-filter_complex", f"[0:a]loudnorm=I=-16:TP=-2:LRA=9,apad=pad_dur={GAP_BEFORE_CTA}[b];[1:a]loudnorm=I=-16:TP=-2:LRA=9[c];[b][c]concat=n=2:v=0:a=1,atempo={SPEED},"
                    "highpass=f=80,loudnorm=I=-14:TP=-1.5:LRA=9[o]", "-map", "[o]", "-ar", str(SR), "-ac", "1",
                    f"assets/audio/voice-{p}.wav"], check=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                              f"assets/audio/voice-{p}.wav"], capture_output=True, text=True).stdout)
    print(f"{p:10s} {d:.2f}s")
body = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                             f"{TMP}/body-tight.wav"], capture_output=True, text=True).stdout)
print(f"body (before speed-up) {body:.2f}s -> {body / SPEED:.2f}s")
