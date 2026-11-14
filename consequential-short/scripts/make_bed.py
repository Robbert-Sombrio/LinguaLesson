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
env *= np.interp(t, [0, 21.85, 22.35, total], [1, 1, 1.8, 1.8])   # lift under the end card
bed = music * env[:, None] * db(-21)

CUES = [
    # hook
    ("paper", 0.05, 10), ("tap", 0.4, -8), ("marker", 1.0, 2), ("whoosh", 2.1, -10), ("chime", 2.4, -9),
    ("tap", 3.64, -12), ("tap", 3.82, -12), ("tap", 4.0, -12), ("tap", 4.24, -12), ("chime", 5.32, -9), ("whoosh", 6.0, -10),
    # meaning (dominoes)
    ("tap", 6.35, -10), ("tap", 7.2, -4), ("tap", 7.4, -8), ("tap", 7.52, -8), ("tap", 7.64, -8), ("tap", 7.76, -8),
    ("tap", 7.88, -8), ("whoosh", 9.25, -10),
    # example
    ("paper", 9.55, 8), ("tap", 10.82, -6), ("marker", 12.59, 2), ("whoosh", 14.31, -10), ("tap", 14.56, -8),
    ("tap", 14.81, -8), ("whoosh", 15.9, -10),
    # work
    ("paper", 16.25, 8), ("marker", 16.87, 0), ("tap", 17.17, -8), ("marker", 17.8, 2), ("tap", 20.0, -8),
    ("chime", 20.98, -9), ("whoosh", 22.05, -10),
    # end card (same cues as hegemony, shifted to 22.35)
    ("tap", 22.65, -10), ("tap", 23.15, -10), ("chime", 27.1, -9), ("tap", 30.2, -2), ("chime", 30.3, -8),
    ("tap", 32.2, -8),
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
