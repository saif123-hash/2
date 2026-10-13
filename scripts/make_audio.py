"""Procedurally synthesise the film's music bed and sound effects.

Everything is generated from oscillators and noise here — no samples, no
third-party audio — so the result is original and free to use.
Scene boundaries are read from src/config/timeline.ts so the score follows
edits to the timeline.

usage: python3 -I scripts/make_audio.py   (writes public/audio/*.wav)
"""
import os
import re
import wave
import numpy as np

SR = 44100
FPS = 30
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(11)

# ── timeline ──────────────────────────────────────────────────────────
src = open(os.path.join(os.path.dirname(__file__), '..', 'src', 'config', 'timeline.ts')).read()
block = src[src.index('SCENE_DURATIONS'):src.index('} as const')]
durs = [int(v) for v in re.findall(r's\d:\s*(\d+)', block)]
starts = np.cumsum([0] + durs[:-1])
TOTAL_F = sum(durs)
T = TOTAL_F / FPS + 0.6
S = [s / FPS for s in starts]  # scene start seconds
sec = lambda scene, frame: (starts[scene] + frame) / FPS

# ── helpers ───────────────────────────────────────────────────────────
def tt(d):
    return np.arange(int(d * SR)) / SR

def env_ad(n, a, d):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
    return e

def fft_filter(x, lo=None, hi=None, order=2):
    n = len(x)
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(fr)
    if hi:
        g *= 1 / np.sqrt(1 + (fr / hi) ** (2 * order))
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(fr, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * g, n)

def sweep_filter(x, f0, f1, q=4.0):
    """State-variable band-pass with an exponential centre sweep."""
    n = len(x)
    fc = f0 * (f1 / f0) ** (np.arange(n) / n)
    out = np.zeros(n)
    low = band = 0.0
    damp = 1 / q
    for i in range(n):
        f = 2 * np.sin(np.pi * fc[i] / SR)
        high = x[i] - low - damp * band
        band += f * high
        low += f * band
        out[i] = band
    return out

def reverb(x, secs=1.8, mix=0.25, pre=0.012):
    n = int(secs * SR)
    ir = rng.normal(0, 1, n) * np.exp(-np.arange(n) / (SR * secs / 6.5))
    ir = fft_filter(ir, hi=5200)
    ir[: int(pre * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n
    wet = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)]
    return x * (1 - mix) + wet * mix * 0.9

def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak

def write(name, left, right=None):
    if right is None:
        right = left
    st = np.stack([left, right], 1)
    st = np.clip(st, -1, 1)
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())

def midi(m):
    return 440 * 2 ** ((m - 69) / 12)

def saw(t, f):
    p = t * f
    return 2 * (p - np.floor(p + 0.5))

# ── sound effects ─────────────────────────────────────────────────────
def sfx():
    out = {}
    t = tt(0.12)
    out['tick'] = norm((np.sin(2 * np.pi * 2300 * t) * 0.6 + fft_filter(rng.normal(0, 1, len(t)), lo=3000) * 0.4) * env_ad(len(t), 0.001, 0.018), 0.55)
    t = tt(0.1)
    out['click'] = norm((np.sin(2 * np.pi * 1250 * t) * 0.5 + fft_filter(rng.normal(0, 1, len(t)), lo=1500, hi=7000) * 0.5) * env_ad(len(t), 0.0005, 0.012), 0.5)
    t = tt(1.4)
    f = 38 + 110 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.002, 0.42)
    crack = fft_filter(rng.normal(0, 1, len(t)), lo=200, hi=3500) * env_ad(len(t), 0.0005, 0.05)
    out['impact'] = norm(reverb(np.tanh(boom * 1.6) * 0.9 + crack * 0.45, 1.6, 0.22), 0.95)
    t = tt(0.5)
    f = 46 + 60 * np.exp(-t * 14)
    out['thud'] = norm(np.tanh(1.4 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env_ad(len(t), 0.002, 0.13), 0.8)
    n = rng.normal(0, 1, int(0.55 * SR))
    e = np.sin(np.linspace(0, np.pi, len(n))) ** 2
    out['swoosh'] = norm(sweep_filter(n, 500, 4200, 2.2) * e, 0.45)
    n = rng.normal(0, 1, int(0.9 * SR))
    e = np.sin(np.linspace(0, np.pi, len(n))) ** 1.5
    out['whoosh'] = norm(sweep_filter(n, 2600, 260, 1.8) * e, 0.4)
    t = tt(0.42)
    n = rng.normal(0, 1, len(t))
    e = np.minimum(1, t / 0.28) * np.exp(-np.maximum(0, t - 0.28) / 0.04)
    glide = np.sin(2 * np.pi * np.cumsum(700 + 900 * t / 0.42) / SR) * 0.18
    out['sweep'] = norm((sweep_filter(n, 900, 6500, 3.0) * 0.8 + glide) * e, 0.42)
    t = tt(0.9)
    chime = (np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1975.5 * t) + 0.3 * np.sin(2 * np.pi * 2637 * t)) * env_ad(len(t), 0.002, 0.22)
    tk = np.zeros(len(t))
    for off in (0.0, 0.055):
        i = int(off * SR)
        k = out['click'][: len(t) - i]
        tk[i: i + len(k)] += k
    out['align'] = norm(reverb(tk * 0.8 + chime * 0.35, 1.0, 0.25), 0.55)
    t = tt(0.45)
    sq = np.sign(np.sin(2 * np.pi * 196 * t)) + np.sign(np.sin(2 * np.pi * 207.6 * t))
    out['error'] = norm(fft_filter(sq, hi=900) * env_ad(len(t), 0.004, 0.11), 0.45)
    t = tt(0.16)
    f = 300 + 520 * np.exp(-t * 40)
    out['pop'] = norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.001, 0.045), 0.5)
    t = tt(3.2)
    notes = [65, 69, 72, 77, 81]  # F major add9-ish shimmer
    ch = sum(np.sin(2 * np.pi * midi(m) * t) * (0.9 ** k) * env_ad(len(t), 0.004 + 0.012 * k, 0.9) for k, m in enumerate(notes))
    sub = np.sin(2 * np.pi * midi(41) * t) * env_ad(len(t), 0.01, 0.8) * 0.8
    out['resolve'] = norm(reverb(ch + sub, 2.6, 0.38), 0.7)
    for k, v in out.items():
        write(f'sfx-{k}.wav', v)
    return out

# ── music ─────────────────────────────────────────────────────────────
def music():
    BPM = 120
    beat = 60 / BPM
    N = int(T * SR)
    drums = np.zeros(N)
    bass = np.zeros(N)
    padL = np.zeros(N)
    padR = np.zeros(N)
    arpL = np.zeros(N)
    arpR = np.zeros(N)
    kick_env = np.zeros(N)

    def add(buf, x, at):
        i = int(at * SR)
        if i >= N:
            return
        x = x[: N - i]
        buf[i: i + len(x)] += x

    t_drop = sec(0, 88)  # the uninvited sixth strip lands
    t_s6 = S[5]
    t_hit6 = sec(5, 54)
    t_logo = sec(5, 150)
    t_pause = (sec(4, 100), sec(4, 118))  # review indicator stops on the error

    # chords: Dm9 – Bbmaj7 – Fadd9 – C(sus2), two bars each
    chords = [[50, 57, 60, 64, 65], [46, 53, 57, 60, 62], [41, 53, 57, 60, 67], [48, 55, 60, 62, 67]]
    bar = 4 * beat

    kt = tt(0.45)
    kf = 44 + 100 * np.exp(-kt * 30)
    kick = np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(kf) / SR)) * env_ad(len(kt), 0.001, 0.12)
    kick += fft_filter(rng.normal(0, 1, len(kt)), lo=2500) * env_ad(len(kt), 0.0005, 0.004) * 0.3
    ht = tt(0.08)
    hat = fft_filter(rng.normal(0, 1, len(ht)), lo=7000) * env_ad(len(ht), 0.0005, 0.018)
    ct = tt(0.25)
    clap = np.zeros(len(ct))
    for off in (0, 0.009, 0.019):
        i = int(off * SR)
        c = fft_filter(rng.normal(0, 1, len(ct) - i), lo=900, hi=5000) * env_ad(len(ct) - i, 0.0005, 0.03)
        clap[i:] += c
    clap = reverb(clap, 0.8, 0.3)

    steps = int(T / (beat / 4))
    for s in range(steps):
        at = s * beat / 4
        if at > T - 0.5:
            break
        b16 = s % 16
        in_pause = t_pause[0] <= at < t_pause[1]
        groove = t_drop <= at < t_s6 + 0.0 and not in_pause
        outro_groove = t_hit6 <= at < t_logo
        # kick
        if (groove or outro_groove) and b16 in (0, 6, 8, 11) and not (outro_groove and b16 in (6, 11)):
            add(drums, kick * (1.0 if b16 in (0, 8) else 0.55), at)
            add(kick_env, env_ad(int(0.3 * SR), 0.005, 0.12), at)
        # hats: very light before the drop, steady eighths after
        if at < t_logo + 1.0:
            if groove or outro_groove:
                v = 0.22 if b16 % 4 == 2 else 0.1 if b16 % 2 == 0 else 0.05
                add(drums, hat * v, at + (0.012 if b16 % 2 else 0))
            elif at < t_drop and b16 % 2 == 0:
                add(drums, hat * 0.07 * (0.5 + at / t_drop), at)
        # clap on 2 & 4 in the main groove
        if groove and at > S[1] and b16 in (4, 12):
            add(drums, clap * 0.32, at)

        # bass: eighth-note pulse on the chord root
        if s % 2 == 0 and at < t_logo + 0.2 and not in_pause:
            ch = chords[int(at // (2 * bar)) % 4]
            root = ch[0] - 12
            bt = tt(beat / 2)
            v = 0.5 if at < t_drop else 0.75
            note = np.sin(2 * np.pi * midi(root) * bt) + 0.25 * np.sin(2 * np.pi * midi(root + 12) * bt)
            note = np.tanh(note * 1.6) * env_ad(len(bt), 0.004, 0.16) * v
            add(bass, note, at)

        # arp plucks from Scene 02 onward
        if S[1] <= at < t_logo + 0.1 and not in_pause:
            ch = chords[int(at // (2 * bar)) % 4]
            seq = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 12, ch[1] + 24, ch[4] + 12, ch[2] + 12, ch[3] + 24]
            m = seq[s % 8]
            pt = tt(0.42)
            pl = (np.sin(2 * np.pi * midi(m) * pt) + 0.35 * np.sin(2 * np.pi * 2 * midi(m) * pt) + 0.12 * np.sin(2 * np.pi * 3 * midi(m) * pt))
            pl *= env_ad(len(pt), 0.002, 0.09 if s % 4 else 0.16)
            vel = 0.16 if s % 4 == 0 else 0.09
            if at >= t_s6:
                vel *= 0.8
            pan = 0.35 * np.sin(s * 0.7)
            add(arpL, pl * vel * (1 - pan), at)
            add(arpR, pl * vel * (1 + pan), at + 0.004)

    # pads: one voice per chord, long attack/release
    nb = int(np.ceil(T / (2 * bar)))
    for k in range(nb):
        at = k * 2 * bar
        if at >= T:
            break
        ch = chords[k % 4]
        d = 2 * bar + 1.2
        pt = tt(d)
        sig = np.zeros(len(pt))
        for m in ch[1:]:
            for det in (-0.09, 0.0, 0.08):
                sig += saw(pt, midi(m) * 2 ** (det / 12)) * 0.12
        sig = fft_filter(sig, hi=900 if at < S[1] else 1600, order=2)
        e = np.minimum(1, pt / 0.9) * np.minimum(1, np.maximum(0, (d - pt) / 1.2))
        v = 0.22 if at < t_drop else 0.3
        add(padL, sig * e * v, at)
        add(padR, np.roll(sig, int(0.011 * SR)) * e * v, at)

    # final resolve: sustained Fmaj9 under the logo
    rt = tt(T - t_logo)
    fin = np.zeros(len(rt))
    for m in (41, 53, 57, 60, 64, 67):
        for det in (-0.07, 0.07):
            fin += saw(rt, midi(m) * 2 ** (det / 12)) * 0.1
    fin = fft_filter(fin, hi=1300) * np.minimum(1, rt / 0.25) * np.exp(-rt / 2.4)
    add(padL, fin * 0.45, t_logo)
    add(padR, np.roll(fin, int(0.013 * SR)) * 0.45, t_logo)

    # sidechain duck from the kick
    duck = 1 - 0.45 * np.clip(fft_filter(kick_env, hi=40), 0, 1)
    t_all = np.arange(N) / SR
    # pre-drop: pads breathe under a rising filter, gentle global fade-in
    fade_in = np.minimum(1, t_all / 0.08)
    fade_out = np.clip((T - 0.4 - t_all) / 1.6, 0, 1)
    L = drums + (bass + padL) * duck + arpL
    R = drums + (bass + padR) * duck + arpR
    L = reverb(L, 1.4, 0.14)
    R = reverb(R, 1.5, 0.14)
    L *= fade_in * fade_out
    R *= fade_in * fade_out
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    L, R = np.tanh(L / peak * 1.3) * 0.8, np.tanh(R / peak * 1.3) * 0.8
    write('music.wav', L, R)

sfx()
music()
print('audio written to', os.path.abspath(OUT), f'({T:.2f}s music)')
