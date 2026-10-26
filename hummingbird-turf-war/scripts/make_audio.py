"""Synthesise the 15 s soundtrack: pad, pluck motif, wing hum, chitter, whooshes, hits."""
import sys
import wave
import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
out = np.zeros((N, 2))


def env(start, attack, decay, length=None):
    e = np.zeros(N)
    i0 = int(start * SR)
    L = int((length or (attack + decay * 6)) * SR)
    i1 = min(N, i0 + L)
    tt = np.arange(i1 - i0) / SR
    e[i0:i1] = np.minimum(tt / max(attack, 1e-4), 1.0) * np.exp(-np.maximum(tt - attack, 0) / decay)
    return e


def add(sig, gain=1.0, pan=0.0):
    out[:, 0] += sig * gain * (1 - pan) * 0.5 ** 0.5 * 1.2
    out[:, 1] += sig * gain * (1 + pan) * 0.5 ** 0.5 * 1.2


def lowpass(x, cutoff):
    # one-pole low-pass applied in the frequency domain
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + 1j * f / cutoff), n=len(x))


def note(f):
    return 440 * 2 ** ((f - 69) / 12)


# pad: A major add9, slow swell, resolves at the end
pad = np.zeros(N)
for m in [57, 61, 64, 71]:
    for det in (-0.08, 0.08):
        pad += np.sin(2 * np.pi * note(m + det) * t)
pad_env = np.clip(t / 2.0, 0, 1) * np.clip((DUR - t) / 1.2, 0, 1)
add(pad * pad_env / 8, 0.22)

# pluck motif on each shot
motif = [(0.25, 76), (0.55, 81), (3.0, 79), (3.25, 83), (6.0, 84), (6.2, 88),
         (9.0, 81), (9.2, 79), (12.2, 81), (12.45, 85), (12.7, 88), (13.6, 93)]
for st, m in motif:
    f = note(m)
    e = env(st, 0.004, 0.35)
    add((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * e, 0.22, pan=0.2)

# wing hum: noise amplitude-modulated at ~45 Hz, low-passed
noise = rng.standard_normal(N)
hum = lowpass(noise, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 46 * t))
hum_level = np.interp(t, [0, 3, 6, 9, 12, 15], [0.9, 1.0, 0.8, 0.6, 0.8, 0.5])
add(hum * hum_level, 0.18)

# chitter: fast chirp bursts
for start, count in [(3.95, 9), (9.25, 7)]:
    for k in range(count):
        st = start + k * 0.07 + (k % 3) * 0.01
        i0 = int(st * SR)
        L = int(0.035 * SR)
        tt = np.arange(L) / SR
        f = 5200 + 1800 * np.sin(k * 1.9) - 30000 * tt
        chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.035)
        sig = np.zeros(N)
        sig[i0:i0 + L] = chirp
        add(sig, 0.22, pan=0.3 if start < 5 else -0.3)

# whooshes: band of noise with rising/falling level
def whoosh(st, length, gain, cutoff, pan=0.0):
    sig = lowpass(rng.standard_normal(N), cutoff)
    e = np.zeros(N)
    i0 = int(st * SR)
    L = int(length * SR)
    e[i0:i0 + L] = np.sin(np.pi * np.linspace(0, 1, L)) ** 2
    add(sig * e, gain, pan)


whoosh(3.0, 0.8, 0.5, 2500, 0.5)    # rival arrives
whoosh(6.0, 0.95, 0.35, 1500)       # climb
whoosh(7.1, 0.75, 0.75, 3500)       # plunge-dive
whoosh(9.9, 0.9, 0.5, 2500, -0.5)   # chase
whoosh(10.6, 0.9, 0.35, 1800, -0.8) # rival exits

# low thump at the dive pass and a soft glitter on the gorget flare
for st, g in [(7.72, 0.9), (10.25, 0.5)]:
    e = env(st, 0.002, 0.12)
    f = 90 * np.exp(-np.maximum(t - st, 0) * 6)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * e, g)
for k in range(10):
    st = 4.0 + k * 0.09
    e = env(st, 0.002, 0.08)
    add(np.sin(2 * np.pi * note(96 + (k * 5) % 12) * t) * e, 0.06, pan=0.4)

# jab click
e = env(10.25, 0.001, 0.015)
add(rng.standard_normal(N) * e, 0.35)

peak = np.max(np.abs(out))
out = out / peak * 0.8
pcm = (out * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1])
