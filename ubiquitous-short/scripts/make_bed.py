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
env *= np.interp(t, [0, 31.25, 31.75, total], [1, 1, 1.8, 1.8])   # lift under the end card
bed = music * env[:, None] * db(-21)

CUES = [
    ("paper", 0.05, 12), ("marker", 0.83, 2), ("tap", 4.85, -10), ("tap", 6.15, -12), ("tap", 6.37, -12),
    ("tap", 6.59, -12), ("tap", 6.81, -12), ("chime", 7.52, -9), ("whoosh", 9.2, -10), ("tap", 12.49, -10),
    ("tap", 16.38, -12), ("tap", 16.46, -12), ("tap", 16.54, -12), ("tap", 17.6, -12), ("tap", 17.68, -12),
    ("tap", 17.76, -12), ("tap", 18.6, -12), ("tap", 18.68, -12), ("tap", 18.76, -12), ("tap", 19.85, -12),
    ("marker", 20.95, 2), ("whoosh", 21.3, -10), ("paper", 21.6, 8), ("marker", 25.14, 0), ("paper", 25.24, 8),
    ("marker", 26.16, 2), ("tap", 27.53, -10), ("paper", 29.75, 6), ("tap", 31.06, -8), ("whoosh", 31.65, -8),
    ("tap", 33.15, -10), ("chime", 33.25, -7),
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
