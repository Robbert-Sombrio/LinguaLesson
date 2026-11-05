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
env *= np.interp(t, [0, 36.7, 37.2, total], [1, 1, 1.8, 1.8])   # lift under the end card
bed = music * env[:, None] * db(-21)

CUES = [
    # hook
    ("paper", 0.05, 12), ("marker", 2.3, 0), ("marker", 4.57, 2), ("tap", 5.40, -12), ("tap", 6.16, -12),
    ("chime", 6.77, -9), ("whoosh", 8.45, -10),
    # wrestle
    ("rope", 10.88, -12), ("tap", 13.70, -10), ("whoosh", 14.73, -10), ("paper", 14.75, 6), ("tap", 15.35, -6),
    ("marker", 19.25, 2), ("rope", 21.20, -12), ("whoosh", 24.40, -10),
    # grapple WITH
    ("marker", 25.58, 0), ("marker", 26.08, 0), ("chime", 26.18, -12), ("tap", 26.88, -4), ("whoosh", 28.03, -10),
    # at work
    ("paper", 28.43, 8), ("tap", 29.28, -8), ("marker", 30.13, 2), ("rope", 30.13, -14), ("tap", 34.79, -10),
    ("tap", 36.10, -10), ("whoosh", 36.88, -8),
    # end card
    ("tap", 38.6, -10), ("chime", 38.7, -7),
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
