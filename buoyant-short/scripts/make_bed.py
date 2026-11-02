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
env *= np.interp(t, [0, 21.6, 22.1, total], [1, 1, 1.8, 1.8])   # lift under the end card
bed = music * env[:, None] * db(-21)

CUES = [
    ("paper", 0.05, 12), ("marker", 0.43, 2), ("tap", 2.45, -10), ("tap", 3.35, -12), ("tap", 3.65, -12),
    ("chime", 4.55, -9), ("whoosh", 6.35, -10), ("whoosh", 7.92, -8), ("tap", 9.29, -10), ("paper", 10.75, 8),
    ("marker", 13.94, 2), ("whoosh", 16.27, -8), ("chime", 16.5, -9), ("whoosh", 17.55, -10), ("tap", 17.8, -12),
    ("tap", 17.9, -12), ("tap", 18.0, -12), ("whoosh", 18.25, -14), ("paper", 19.3, 8), ("marker", 20.95, 2),
    ("whoosh", 22.0, -8), ("tap", 23.5, -10), ("chime", 23.6, -7),
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
