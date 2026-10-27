"""Build voice-<platform>.wav: the main take (two lines cut) + that platform's CTA,
pauses tightened, 7% faster, loudness-normalised. Cut points sit in measured silence."""
import os, subprocess, sys, wave
import numpy as np

SRC = "assets/audio/src/recording.mp3"
SR = 48000
BODY = (0.0, 46.6)
BODY_CUTS = [(18.20, 21.90),   # "Fine. Safe. Forgettable."
             (37.90, 44.05)]   # "It implies you have instruments, you have data, you're making a precise adjustment,"
CTAS = {"youtube": (50.95, 55.25), "tiktok": (57.85, 62.85), "instagram": (65.85, 71.35), "linkedin": (75.25, 81.95)}
GAP_BEFORE_CTA = 0.45
SPEED = 1.07
TMP = sys.argv[1]

pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
fade = int(0.012 * SR)

def piece(a, b):
    s = x[int(a * SR):int(b * SR)].copy()
    s[:fade] *= np.linspace(0, 1, fade); s[-fade:] *= np.linspace(1, 0, fade)
    return s

def write(path, y):
    with wave.open(path, "wb") as o:
        o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR)
        o.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())

def tighten(src, dst):
    subprocess.run([sys.executable, "scripts/tighten_voice.py", src, dst], check=True, capture_output=True,
                   env=dict(os.environ, KEEP="0.30"))

# body with the two lines removed
parts, cur = [], BODY[0]
for a, b in BODY_CUTS:
    parts.append(piece(cur, a)); cur = b
parts.append(piece(cur, BODY[1]))
write(f"{TMP}/body-raw.wav", np.concatenate(parts))
tighten(f"{TMP}/body-raw.wav", f"{TMP}/body-tight.wav")

for p, (a, b) in CTAS.items():
    write(f"{TMP}/cta-{p}-raw.wav", piece(a, b))
    tighten(f"{TMP}/cta-{p}-raw.wav", f"{TMP}/cta-{p}-tight.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{TMP}/body-tight.wav", "-i", f"{TMP}/cta-{p}-tight.wav",
                    "-filter_complex", f"[0:a]apad=pad_dur={GAP_BEFORE_CTA}[b];[b][1:a]concat=n=2:v=0:a=1,atempo={SPEED},"
                    "highpass=f=80,loudnorm=I=-14:TP=-1.5:LRA=9[o]", "-map", "[o]", "-ar", str(SR), "-ac", "1",
                    f"assets/audio/voice-{p}.wav"], check=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                              f"assets/audio/voice-{p}.wav"], capture_output=True, text=True).stdout)
    print(f"{p:10s} {d:.2f}s")
body = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                             f"{TMP}/body-tight.wav"], capture_output=True, text=True).stdout)
print(f"body (before speed-up) {body:.2f}s -> {body / SPEED:.2f}s")
