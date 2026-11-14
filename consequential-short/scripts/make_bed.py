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
env *= np.interp(t, [0, 24.42, 24.92, total], [1, 1, 1.8, 1.8])   # lift under the end card
bed = music * env[:, None] * db(-21)

CUES = [
    # hook: strike, Economist card, the word
    ("paper", 0.05, 10), ("marker", 1.05, 2), ("whoosh", 2.0, -10), ("paper", 2.25, 6), ("marker", 3.5, 2),
    ("whoosh", 4.5, -10), ("chime", 5.3, -9), ("tap", 5.6, -12), ("tap", 5.75, -12), ("tap", 5.9, -12),
    ("tap", 6.05, -12), ("chime", 6.15, -11), ("whoosh", 6.65, -10),
    # meaning: matters + consequences, dominoes, weight, cascade
    ("tap", 7.7, -8), ("tap", 9.55, -8), ("marker", 10.32, 2), ("whoosh", 10.95, -10), ("tap", 11.25, -10),
    ("tap", 12.15, -2), ("tap", 13.89, -4), ("tap", 14.09, -8), ("tap", 14.21, -8), ("tap", 14.33, -8),
    ("tap", 14.45, -8), ("tap", 14.57, -8), ("whoosh", 15.1, -10),
    # email
    ("paper", 15.45, 8), ("marker", 18.1, 0), ("tap", 18.4, -8), ("marker", 20.2, 2), ("tap", 21.8, -8),
    ("chime", 22.61, -9), ("whoosh", 23.15, -10),
    # drill
    ("tap", 23.45, -12), ("tap", 23.52, -12), ("tap", 23.59, -12), ("tap", 23.66, -12), ("chime", 23.95, -9),
    # end card (same cues as hegemony, shifted to 24.92)
    ("tap", 25.22, -10), ("tap", 25.72, -10), ("chime", 29.67, -9), ("tap", 32.77, -2), ("chime", 32.87, -8),
    ("tap", 34.77, -8),
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
