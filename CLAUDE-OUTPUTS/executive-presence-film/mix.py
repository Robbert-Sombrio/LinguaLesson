# Score, foley and voice → out/mix.wav (48 kHz stereo).
# Score: 96 bpm mallets in A minor pentatonic, synthesised (no samples), built section by section
# from timeline.json. Foley: dry print sounds from events.json (core/audio/sfx.py). Voice: Brian, take 1,
# with 1.6 s of silence inserted before "The silence did the work."
import json, os, sys
import numpy as np
import soundfile as sf
import soxr

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ["LIB"]
sys.path.insert(0, f"{LIB}/core/audio")
import sfx  # noqa: E402
from sfx import SR, add, t_, env_exp, noise, hp, lp, bp, norm  # noqa: E402

TL = json.load(open(f"{HERE}/timeline.json"))
EV = json.load(open(f"{HERE}/events.json"))["ev"]
DUR, M, CH = TL["dur"], TL["m"], {c["n"]: c["t"] for c in TL["ch"]}
N = int(DUR * SR)
BEAT = 60 / 96; E8 = BEAT / 2; BAR = BEAT * 4
rng = np.random.default_rng(11)

# ---------------- voice ----------------
v, vsr = sf.read(f"{HERE}/voice/take1.wav", dtype="float32")
if v.ndim > 1: v = v.mean(1)
if vsr != SR: v = soxr.resample(v, vsr, SR)
cut = int((TL["gap"]["at"] + 0.12) * SR)
v = np.concatenate([v[:cut], np.zeros(int(TL["gap"]["len"] * SR), np.float32), v[cut:]])
v = hp(v, 70)
v = v / (np.sqrt(np.mean(v[np.abs(v) > 0.01] ** 2)) + 1e-9) * 0.12        # RMS of speech ≈ −18 dBFS
v = sfx.compress(v, thr=0.16, ratio=3.0, att=0.003, rel=0.12)
v = v / (np.sqrt(np.mean(v[np.abs(v) > 0.01] ** 2)) + 1e-9) * 0.14
voice = np.zeros(N, np.float32); voice[:min(N, len(v))] = v[:N]

# ---------------- instruments ----------------
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def marimba(m, vel=1.0, d=0.9):
    tt = t_(d); f = mtof(m)
    x = (np.sin(2 * np.pi * f * tt) * env_exp(d, 0.32) + 0.35 * np.sin(2 * np.pi * f * 3.93 * tt) * env_exp(d, 0.05)
         + 0.12 * np.sin(2 * np.pi * f * 9.2 * tt) * env_exp(d, 0.012))
    x[:240] += hp(noise(0.005), 2000) * 0.25 * np.linspace(1, 0, 240)       # mallet
    x *= np.minimum(1, tt / 0.002)
    return x * vel
def vibes(m, vel=1.0, d=2.6):
    tt = t_(d); f = mtof(m)
    x = (np.sin(2 * np.pi * f * tt) + 0.22 * np.sin(2 * np.pi * f * 4.0 * tt) * env_exp(d, 0.4)) * env_exp(d, 1.1)
    x *= (1 - 0.18 * (0.5 + 0.5 * np.sin(2 * np.pi * 5.2 * tt)))            # motor tremolo
    x *= np.minimum(1, tt / 0.003)
    return x * vel
def kick(vel=1.0):
    d = 0.35; tt = t_(d); f = 52 + 40 * np.exp(-tt / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, 0.11)
    x += 0.35 * np.sin(2 * np.pi * 2 * np.cumsum(f) / SR) * env_exp(d, 0.05)  # harmonics so it speaks on small speakers
    return lp(x, 900) * vel
def hat(vel=1.0):
    d = 0.05; return hp(noise(d), 7000) * env_exp(d, 0.008) * vel

music = np.zeros((N, 2), np.float32)
def put(x, at, g, pan=0.0):
    if at < DUR: add(music, x.astype(np.float32), at, g, pan)

# A minor pentatonic progression, one chord per bar: Am, F(add9), C, G(sus)
CHORDS = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 60, 64, 67], [55, 59, 62, 67]]
PAT = [0, 2, 1, 3, 2, 1, 3, 2]                 # arpeggio order in eighths
def bars(a, b):
    k = int(np.ceil(a / BAR - 1e-6))
    while k * BAR < b - 1e-6:
        yield k, k * BAR; k += 1

stop = np.floor(M["silence_start"] / BAR) * BAR + BAR   # hard stop on the downbeat after "one device."
if stop > M["silence_start"] + 0.6: stop -= BAR / 2
sections = [
    ("intro", 0, CH[1]), ("a", CH[1], CH[4]), ("b", CH[4], CH[8]), ("thin", CH[8], stop),
    ("half", CH[9], M["recap"]), ("full", M["recap"], M["end"]),
]
for name, a, b in sections:
    for k, t0 in bars(a, b):
        ch = CHORDS[k % 4]
        if name in ("intro", "thin"):
            for bt in (0, 2):
                if t0 + bt * BEAT < b: put(vibes(ch[(k + bt) % 4], 0.55), t0 + bt * BEAT, 0.16, -0.2 + 0.4 * (bt / 2))
            continue
        if name == "half":
            for i in range(4):
                if t0 + i * BEAT < b: put(marimba(ch[PAT[i * 2]], 0.8), t0 + i * BEAT, 0.16, -0.15)
            if t0 < b: put(kick(0.7), t0, 0.22)
            continue
        for i in range(8):
            tt = t0 + i * E8
            if tt >= b: break
            vel = 0.85 if i % 2 == 0 else 0.6
            put(marimba(ch[PAT[i]], vel + rng.uniform(-0.05, 0.05)), tt, 0.15, -0.25)
            if name in ("b", "full") and i % 4 == 3:
                put(marimba(ch[PAT[i]] + 7, 0.55), tt, 0.10, 0.3)         # a second line, a fifth up
            if name in ("b", "full") and i % 2 == 1:
                put(hat(0.6), tt, 0.05, 0.25)
        put(kick(0.8), t0, 0.22)
        if name in ("b", "full"): put(kick(0.5), t0 + 2 * BEAT, 0.16)
# the end card: one vibraphone chord, ringing out
for i, m_ in enumerate([57, 64, 69, 72]):
    put(vibes(m_, 0.6, d=6.0), M["end"] + i * 0.02, 0.14, -0.3 + 0.2 * i)

# the hard stop: everything cut on the downbeat, nothing until chapter 9
s0, s1 = int(stop * SR), int(CH[9] * SR)
music[s0:s0 + 480] *= np.linspace(1, 0, 480)[:, None]; music[s0 + 480:s1] = 0

# duck the music under the voice (~8 dB), smoothed
from scipy.ndimage import uniform_filter1d, maximum_filter1d
venv = uniform_filter1d(np.abs(voice), int(0.05 * SR))
act = maximum_filter1d((venv > 0.02).astype(np.float32), int(0.25 * SR))
act = uniform_filter1d(act, int(0.2 * SR))
music *= (1 - act * (1 - 10 ** (-8 / 20)))[:, None]

# ---------------- foley ----------------
fol = np.zeros((N, 2), np.float32)
def fput(x, at, g, pan=0.0): add(fol, np.asarray(x, np.float32), at, g, pan)
def slide(d):
    tt = t_(d); return bp(noise(d), 900, 4000) * np.sin(np.pi * tt / d) ** 2 * 0.5
def snick():
    d = 0.12; tt = t_(d)
    return hp(noise(d), 3000) * env_exp(d, 0.01) + 0.5 * np.sin(2 * np.pi * 3100 * tt) * env_exp(d, 0.02)
def pen(d):
    tt = t_(d); return hp(noise(d), 5000) * np.minimum(1, tt / 0.05) * np.minimum(1, (d - tt) / 0.2) * 0.4
def ptick(v=1.0): return sfx.click(1.6, v) * 0.5
for e in EV:
    t, ty, gg = e["t"], e["type"], e.get("g", 1.0)
    if ty == "slide": fput(slide(e.get("dur", 1.0)), t, 0.10, -0.3)
    elif ty == "ticks":
        for k in range(14): fput(ptick(0.6), t + k * 0.035 + rng.uniform(0, 0.01), 0.05, rng.uniform(-0.6, 0.6))
    elif ty == "tick": fput(ptick(), t, 0.07, 0.2)
    elif ty == "clack": fput(sfx.clack(0.8), t, 0.09, -0.1)
    elif ty == "pan": fput(sfx.whoosh(0.4, 0.6), t, 0.06)
    elif ty == "thunk": fput(sfx.thump(0.8, f=95), t, 0.16 * gg)
    elif ty == "slab": fput(sfx.thump(1.0, f=70), t, 0.24); fput(sfx.clack(0.6), t, 0.06)
    elif ty == "snick": fput(snick(), t, 0.10 * gg, 0.15)
    elif ty == "count":
        for k in range(31): fput(ptick(0.5), t + e["dur"] * (k / 31) ** 0.6, 0.04, 0.3)
    elif ty == "pen": fput(pen(e.get("dur", 1.0)), t, 0.10, 0.2)
    elif ty == "felt": fput(sfx.thump(1.0, f=60), t, 0.32)
    elif ty == "stamp": fput(sfx.thump(1.0, f=80), t, 0.22); fput(sfx.clack(0.5), t, 0.08)
# a very low room tone under the opening only
rt = lp(noise(CH[1] + 1.0), 300) * 0.006
fol[:len(rt), :] += (rt * np.minimum(1, np.linspace(1.5, 0, len(rt))))[:, None].astype(np.float32)

# ---------------- mix ----------------
music *= 0.75                                                 # voice ≈ 17 dB above the music under speech (Sean: quieter)
out = music + fol + np.stack([voice, voice], 1) * 1.0
peak = np.abs(out).max()
for c in range(2): out[:, c] = sfx.limit(out[:, c], 0.95)
os.makedirs(f"{HERE}/out", exist_ok=True)
sf.write(f"{HERE}/out/mix.wav", out, SR, subtype="FLOAT")
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
spk = np.abs(voice) > 0.01
print(f"mix.wav {len(out)/SR:.2f}s peak {peak:.2f} | voice {rms(voice[spk]):.1f} dB, music {rms(music[spk, 0]):.1f} dB under speech, music alone {rms(music[~spk, 0]):.1f} dB")
