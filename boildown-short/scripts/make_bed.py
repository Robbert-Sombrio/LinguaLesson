"""Build the music + SFX bed: loop the music to length, keep it low under the voice, place the SFX cues."""
import subprocess, sys, wave
import numpy as np

SR = 48000
music_src, sfx_dir, out_path, total = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
N = int(total * SR)

def load(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-map", "0:a:0", "-ac", "2", "-ar", str(SR),
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.int16).astype(np.float32).reshape(-1, 2) / 32768

def db(x):
    return 10 ** (x / 20)

# music: loop with a 3 s crossfade until it covers the video
m = load(music_src)
xf = 3 * SR
music = m.copy()
while len(music) < N:
    ramp = np.linspace(0, 1, xf)[:, None]
    head = music[:-xf]
    blend = music[-xf:] * (1 - ramp) + m[:xf] * ramp
    music = np.concatenate([head, blend, m[xf:]])
music = music[:N]
t = np.arange(N) / SR
env = np.clip(t / 1.5, 0, 1) * np.clip((total - t) / 2.0, 0, 1)
env *= np.interp(t, [0, 25.21, 25.71, total], [1, 1, 1.8, 1.8])   # lift under the end card
bed = music * env[:, None] * db(-21)

CUES = [
    # hook
    ("paper", 0.05, 10), ("tap", 2.0, -8), ("tap", 2.45, -6), ("chime", 2.6, -10), ("tap", 2.85, -8), ("whoosh", 3.05, -10),
    # meaning: the pot
    ("tap", 4.26, -8), ("whoosh", 5.8, -12), ("tap", 6.0, -12), ("tap", 6.1, -12), ("whoosh", 6.6, -14),
    ("whoosh", 7.1, -14), ("whoosh", 7.6, -14), ("chime", 8.4, -8), ("whoosh", 9.05, -10),
    # example: Economist card, web
    ("paper", 9.35, 8), ("marker", 12.8, 2), ("tap", 13.6, -8), ("marker", 13.9, -2), ("tap", 14.0, -10),
    ("tap", 14.1, -10), ("tap", 14.2, -10), ("whoosh", 15.35, -10),
    # meeting
    ("paper", 16.9, 8), ("tap", 18.52, -8), ("marker", 19.9, 2), ("tap", 20.85, -6), ("tap", 21.35, -6), ("whoosh", 22.0, -10),
    # close
    ("tap", 22.35, -6), ("tap", 23.05, -10), ("chime", 23.8, -10), ("chime", 23.92, -12), ("chime", 24.04, -14), ("whoosh", 25.45, -10),
    # end card (same cues as hegemony, shifted to 25.71)
    ("tap", 26.01, -10), ("tap", 26.51, -10), ("chime", 30.46, -9), ("tap", 33.56, -2), ("chime", 33.66, -8),
    ("tap", 35.56, -8),
]
cache = {}
for name, at, gain in CUES:
    s = cache.setdefault(name, load(f"{sfx_dir}/{name}.mp3"))
    i0 = int(at * SR)
    n = min(len(s), N - i0)
    bed[i0:i0 + n] += s[:n] * db(gain - 6)

peak = np.max(np.abs(bed))
if peak > 0.95:
    bed *= 0.95 / peak
with wave.open(out_path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((bed * 32767).astype(np.int16).tobytes())
print(f"bed {total}s, {len(CUES)} cues, peak {20*np.log10(max(peak,1e-9)):.1f} dBFS")
