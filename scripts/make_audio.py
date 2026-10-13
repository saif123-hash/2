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
    out['tick'] = norm(fft_filter(np.sin(2 * np.pi * 1350 * t) * 0.8 + fft_filter(rng.normal(0, 1, len(t)), lo=1500) * 0.2, hi=4000) * env_ad(len(t), 0.001, 0.014), 0.45)
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
    out['swoosh'] = norm(sweep_filter(n, 400, 2600, 1.8) * e, 0.32)
    n = rng.normal(0, 1, int(0.9 * SR))
    e = np.sin(np.linspace(0, np.pi, len(n))) ** 1.5
    out['whoosh'] = norm(sweep_filter(n, 1800, 220, 1.6) * e, 0.34)
    t = tt(0.42)
    n = rng.normal(0, 1, len(t))
    e = np.minimum(1, t / 0.28) * np.exp(-np.maximum(0, t - 0.28) / 0.04)
    glide = np.sin(2 * np.pi * np.cumsum(700 + 900 * t / 0.42) / SR) * 0.18
    out['sweep'] = norm((sweep_filter(n, 600, 3200, 2.2) * 0.7 + glide * 0.6) * e, 0.32)
    t = tt(0.9)
    chime = (np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1975.5 * t) + 0.3 * np.sin(2 * np.pi * 2637 * t)) * env_ad(len(t), 0.002, 0.22)
    tk = np.zeros(len(t))
    for off in (0.0, 0.055):
        i = int(off * SR)
        k = out['click'][: len(t) - i]
        tk[i: i + len(k)] += k
    out['align'] = norm(reverb(tk * 0.8 + chime * 0.35, 1.0, 0.25), 0.55)
    t = tt(0.45)
    # soft two-note "not quite": a descending sine pair, no buzz
    half = len(t) // 2
    tone = np.concatenate([np.sin(2 * np.pi * 523 * t[:half]) * env_ad(half, 0.004, 0.08), np.sin(2 * np.pi * 392 * t[: len(t) - half]) * env_ad(len(t) - half, 0.004, 0.12)])
    out['error'] = norm(reverb(tone, 0.8, 0.25), 0.4)
    t = tt(0.16)
    f = 300 + 520 * np.exp(-t * 40)
    out['pop'] = norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.001, 0.045), 0.5)
    t = tt(3.2)
    notes = [65, 69, 72, 77, 81]  # F major add9-ish shimmer
    ch = sum(np.sin(2 * np.pi * midi(m) * t) * (0.9 ** k) * env_ad(len(t), 0.004 + 0.012 * k, 0.9) for k, m in enumerate(notes))
    sub = np.sin(2 * np.pi * midi(41) * t) * env_ad(len(t), 0.01, 0.8) * 0.8
    out['resolve'] = norm(reverb(ch + sub, 2.6, 0.38), 0.7)
    t = tt(1.1)
    n = rng.normal(0, 1, len(t))
    e = (t / t[-1]) ** 2.2 * np.minimum(1, (t[-1] - t) / 0.03 + 0.0)
    tone = np.sin(2 * np.pi * np.cumsum(220 + 900 * (t / t[-1]) ** 2) / SR) * 0.25
    out['riser'] = norm((sweep_filter(n, 300, 4000, 2.2) * 0.6 + tone) * e, 0.32)
    t = tt(0.6)
    f = 52 + 140 * np.exp(-t * 26)
    body = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env_ad(len(t), 0.001, 0.14)
    snap = fft_filter(rng.normal(0, 1, len(t)), lo=1200, hi=9000) * env_ad(len(t), 0.0005, 0.035)
    out['slam'] = norm(reverb(body + snap * 0.6, 0.9, 0.18), 0.9)
    for k, v in out.items():
        write(f'sfx-{k}.wav', v)
    return out

# ── music ─────────────────────────────────────────────────────────────
def music():
    BPM = 112.5  # one beat = 16 frames at 30fps: every cut lands on a beat
    beat = 60 / BPM
    N = int(T * SR)
    drums = np.zeros(N)
    bass = np.zeros(N)
    padL = np.zeros(N)
    padR = np.zeros(N)
    arpL = np.zeros(N)
    arpR = np.zeros(N)
    fx = np.zeros(N)
    kick_env = np.zeros(N)

    def add(buf, x, at):
        i = int(at * SR)
        if i >= N or i + len(x) <= 0:
            return
        if i < 0:
            x = x[-i:]
            i = 0
        x = x[: N - i]
        buf[i: i + len(x)] += x

    t_drop = sec(0, 72)  # the uninvited sixth slab lands
    t_break = (sec(4, 70), sec(4, 98))  # review gate stops on the error
    t_slam6 = sec(5, 40)
    t_exit6 = sec(5, 112)
    t_logo = sec(5, 120)
    cuts = S[1:]

    chords = [[50, 57, 60, 64, 65], [46, 53, 57, 60, 62], [41, 53, 57, 60, 67], [48, 55, 60, 62, 67]]
    bar = 4 * beat

    kt = tt(0.42)
    kf = 46 + 120 * np.exp(-kt * 32)
    kick = np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(kf) / SR)) * env_ad(len(kt), 0.001, 0.13)
    kick += fft_filter(rng.normal(0, 1, len(kt)), lo=2500) * env_ad(len(kt), 0.0005, 0.004) * 0.35
    ht = tt(0.07)
    hat = fft_filter(rng.normal(0, 1, len(ht)), lo=7500) * env_ad(len(ht), 0.0005, 0.016)
    ot = tt(0.3)
    ohat = fft_filter(rng.normal(0, 1, len(ot)), lo=6000) * env_ad(len(ot), 0.001, 0.09)
    ct = tt(0.3)
    clap = np.zeros(len(ct))
    for off in (0, 0.008, 0.017, 0.025):
        i = int(off * SR)
        clap[i:] += fft_filter(rng.normal(0, 1, len(ct) - i), lo=900, hi=6000) * env_ad(len(ct) - i, 0.0005, 0.035)
    clap = reverb(clap, 0.9, 0.3)
    crt = tt(2.2)
    crash = fft_filter(rng.normal(0, 1, len(crt)), lo=3500) * env_ad(len(crt), 0.002, 0.55)
    subt = tt(1.0)
    sub = np.sin(2 * np.pi * np.cumsum(30 + 50 * np.exp(-subt * 6)) / SR) * env_ad(len(subt), 0.003, 0.35)

    steps = int(T / (beat / 4))
    for s16 in range(steps):
        at = s16 * beat / 4
        if at > T - 0.3:
            break
        b16 = s16 % 16
        brk = t_break[0] <= at < t_break[1]
        main = (t_drop <= at < t_exit6) and not brk
        pre = at < t_drop
        tail = at >= t_exit6
        # drums
        if main and b16 % 4 == 0:
            add(drums, kick, at)
            add(kick_env, env_ad(int(0.3 * SR), 0.004, 0.11), at)
        if pre and b16 % 8 == 0 and at > 0.4:
            add(drums, kick * 0.55, at)
        if main and b16 in (4, 12):
            add(drums, clap * 0.38, at)
        if main or (pre and b16 % 2 == 0):
            v = (0.16 if b16 % 4 == 2 else 0.07) * (0.6 if pre else 1)
            add(drums, hat * v, at + (0.01 if b16 % 2 else 0))
        if main and b16 % 4 == 2:
            add(drums, ohat * 0.12, at)
        # bass: driving eighths with an octave bounce
        if s16 % 2 == 0 and not tail and not brk:
            ch = chords[int(at // (2 * bar)) % 4]
            root = ch[0] - 12 + (12 if (s16 // 2) % 4 == 3 else 0)
            bt = tt(beat / 2)
            v = 0.45 if pre else 0.8
            note = np.sin(2 * np.pi * midi(root) * bt) + 0.3 * np.sin(2 * np.pi * midi(root + 12) * bt) + 0.12 * saw(bt, midi(root))
            add(bass, np.tanh(note * 1.7) * env_ad(len(bt), 0.003, 0.13) * v, at)
        # plucked arp
        if S[1] <= at < t_exit6 and not brk:
            ch = chords[int(at // (2 * bar)) % 4]
            seq = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 24, ch[1] + 24, ch[4] + 12, ch[2] + 24, ch[3] + 12]
            m = seq[s16 % 8]
            pt = tt(0.35)
            pl = np.sin(2 * np.pi * midi(m) * pt) + 0.35 * np.sin(2 * np.pi * 2 * midi(m) * pt) + 0.15 * saw(pt, midi(m)) * 0.5
            pl *= env_ad(len(pt), 0.002, 0.07 if s16 % 4 else 0.13)
            vel = 0.14 if s16 % 4 == 0 else 0.08
            pan = 0.4 * np.sin(s16 * 0.9)
            add(arpL, pl * vel * (1 - pan), at)
            add(arpR, pl * vel * (1 + pan), at + 0.005)

    # pads
    nb = int(np.ceil(T / (2 * bar)))
    for k in range(nb):
        at = k * 2 * bar
        if at >= t_logo:
            break
        ch = chords[k % 4]
        d = 2 * bar + 1.0
        pt = tt(d)
        sig = np.zeros(len(pt))
        for m in ch[1:]:
            for det in (-0.1, 0.0, 0.09):
                sig += saw(pt, midi(m) * 2 ** (det / 12)) * 0.11
        sig = fft_filter(sig, hi=1000 if at < t_drop else 2000)
        e = np.minimum(1, pt / 0.5) * np.minimum(1, np.maximum(0, (d - pt) / 1.0))
        add(padL, sig * e * 0.24, at)
        add(padR, np.roll(sig, int(0.011 * SR)) * e * 0.24, at)

    # risers into every cut, crash + sub on every downbeat cut
    riser_n = rng.normal(0, 1, int(beat * 2 * SR))
    rt = np.arange(len(riser_n)) / SR
    riser = sweep_filter(riser_n, 400, 6000, 2.0) * (rt / rt[-1]) ** 2.5
    riser = norm(fft_filter(riser, hi=5000), 0.11)
    for c in cuts:
        add(fx, riser, c - beat * 2)
        add(fx, fft_filter(crash, hi=9000) * 0.07, c)
        add(fx, sub * 0.5, c)
    add(fx, crash * 0.1, t_drop)
    add(fx, sub * 0.7, t_drop)
    add(fx, crash * 0.08, t_slam6)
    add(fx, sub * 0.6, t_slam6)

    # final resolve: sustained Fmaj9 under the logo
    rt2 = tt(T - t_logo)
    fin = np.zeros(len(rt2))
    for m in (41, 53, 57, 60, 64, 67):
        for det in (-0.07, 0.07):
            fin += saw(rt2, midi(m) * 2 ** (det / 12)) * 0.1
    fin = fft_filter(fin, hi=1400) * np.minimum(1, rt2 / 0.15) * np.exp(-rt2 / 2.0)
    add(padL, fin * 0.5, t_logo)
    add(padR, np.roll(fin, int(0.013 * SR)) * 0.5, t_logo)

    duck = 1 - 0.55 * np.clip(fft_filter(kick_env, hi=40), 0, 1)
    t_all = np.arange(N) / SR
    fade_out = np.clip((T - 0.3 - t_all) / 1.4, 0, 1)
    L = drums + (bass + padL) * duck + arpL + fx
    R = drums + (bass + padR) * duck + arpR + fx
    L = reverb(L, 1.2, 0.12) * fade_out
    R = reverb(R, 1.3, 0.12) * fade_out
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    L, R = np.tanh(L / peak * 1.4) * 0.8, np.tanh(R / peak * 1.4) * 0.8
    write('music.wav', L, R)

sfx()
music()
print('audio written to', os.path.abspath(OUT), f'({T:.2f}s music)')
