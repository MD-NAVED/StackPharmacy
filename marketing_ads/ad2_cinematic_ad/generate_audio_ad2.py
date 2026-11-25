"""Synthesize cinema-grade soundtracks for Ad #2:
1) audio_master_23s.wav (0-3s Hook tension -> 3-9s Counter problem -> 9-15s Phone Reveal & Spring Notif -> 15-23s Logo Sting)
2) audio_sting_8s.wav (standalone 8s Logo Sting swoosh, overshoot chime, sparkle burst, warm hold)
"""

import array
import math
import os
import random
import wave

SAMPLE_RATE = 44100
TWO_PI = 2.0 * math.pi

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(BASE_DIR, "textures")
os.makedirs(TEX_DIR, exist_ok=True)


def _pan(p: float) -> tuple[float, float]:
    p = max(-1.0, min(1.0, p))
    ang = (p + 1.0) * math.pi * 0.25
    return math.cos(ang), math.sin(ang)


def add_pad(bl: list[float], br: list[float], t0: float, dur: float, freqs: list[float], amp: float, pump: bool = False):
    n = len(bl)
    s0 = max(0, int(t0 * SAMPLE_RATE))
    s1 = min(n, int((t0 + dur) * SAMPLE_RATE))
    atk = min(0.35, dur * 0.3)
    rel = min(0.55, dur * 0.35)
    for i in range(s0, s1):
        dt = (i - s0) / SAMPLE_RATE
        rem = dur - dt
        env = 1.0
        if dt < atk:
            env *= 0.5 - 0.5 * math.cos(math.pi * dt / atk)
        if rem < rel:
            env *= 0.5 - 0.5 * math.cos(math.pi * max(0.0, rem) / rel)
        duck = 1.0
        if pump:
            bp = (i / SAMPLE_RATE) % 0.5
            duck = 0.65 + 0.35 * min(1.0, bp / 0.14)
        sl = sr = 0.0
        for k, f in enumerate(freqs):
            det = 0.38 if (k % 2 == 0) else -0.38
            sl += math.sin(TWO_PI * (f + det) * dt) + 0.14 * math.sin(TWO_PI * 2.0 * f * dt)
            sr += math.sin(TWO_PI * (f - det) * dt) + 0.14 * math.sin(TWO_PI * 2.0 * f * dt)
        sc = (amp / max(1, len(freqs))) * env * duck
        bl[i] += sl * sc
        br[i] += sr * sc


def add_sub_pulse(bl: list[float], br: list[float], t0: float, freq: float = 55.0, dur: float = 0.45, amp: float = 0.28):
    n = len(bl)
    s0 = max(0, int(t0 * SAMPLE_RATE))
    s1 = min(n, int((t0 + dur) * SAMPLE_RATE))
    ph = 0.0
    for i in range(s0, s1):
        dt = (i - s0) / SAMPLE_RATE
        f = freq * (1.0 + 0.85 * math.exp(-dt * 28.0))
        ph += TWO_PI * f / SAMPLE_RATE
        env = min(1.0, dt / 0.012) * math.exp(-dt * 6.5)
        v = math.sin(ph) * env * amp
        bl[i] += v
        br[i] += v


def add_pluck(bl: list[float], br: list[float], t0: float, freq: float, dur: float = 0.36, amp: float = 0.11, pan: float = 0.0):
    n = len(bl)
    s0 = max(0, int(t0 * SAMPLE_RATE))
    s1 = min(n, int((t0 + dur) * SAMPLE_RATE))
    lg, rg = _pan(pan)
    for i in range(s0, s1):
        dt = (i - s0) / SAMPLE_RATE
        atk = min(1.0, dt / 0.005)
        ph = TWO_PI * freq * dt
        v = (
            math.sin(ph) * math.exp(-dt * 8.0)
            + 0.38 * math.sin(2.0 * ph) * math.exp(-dt * 15.0)
            + 0.12 * math.sin(3.0 * ph) * math.exp(-dt * 24.0)
        ) * atk * amp
        bl[i] += v * lg
        br[i] += v * rg


def add_tick(bl: list[float], br: list[float], t0: float, amp: float = 0.09, pan: float = 0.0):
    n = len(bl)
    s0 = max(0, int(t0 * SAMPLE_RATE))
    s1 = min(n, int((t0 + 0.05) * SAMPLE_RATE))
    lg, rg = _pan(pan)
    for i in range(s0, s1):
        dt = (i - s0) / SAMPLE_RATE
        v = math.sin(TWO_PI * 1850.0 * dt * math.exp(-dt * 15.0)) * math.exp(-dt * 85.0) * amp
        bl[i] += v * lg
        br[i] += v * rg


def add_whoosh(bl: list[float], br: list[float], t_peak: float, pre: float = 0.25, post: float = 0.20, amp: float = 0.18, pan: float = 0.0, seed: int = 11):
    n = len(bl)
    s0 = max(0, int((t_peak - pre) * SAMPLE_RATE))
    sp = int(t_peak * SAMPLE_RATE)
    s1 = min(n, int((t_peak + post) * SAMPLE_RATE))
    lg, rg = _pan(pan)
    rng = random.Random(seed)
    lp = prev = 0.0
    for i in range(s0, s1):
        t = i / SAMPLE_RATE
        env = ((t - (t_peak - pre)) / max(1e-5, pre)) ** 2 if i <= sp else math.exp(-((t - t_peak) / max(1e-5, post)) * 4.5)
        noise = rng.uniform(-1.0, 1.0)
        lp += (0.06 + 0.26 * env) * (noise - lp)
        bp = lp - 0.72 * prev
        prev = lp
        v = bp * env * amp
        bl[i] += v * lg
        br[i] += v * rg


def add_chime(bl: list[float], br: list[float], t0: float, freqs: list[float], amp: float = 0.22, decay: float = 3.2, stagger: float = 0.04):
    n = len(bl)
    for idx, f in enumerate(freqs):
        ft = t0 + idx * stagger
        s0 = max(0, int(ft * SAMPLE_RATE))
        s1 = min(n, int((ft + 1.6) * SAMPLE_RATE))
        lg, rg = _pan(-0.25 + 0.22 * idx)
        for i in range(s0, s1):
            dt = (i - s0) / SAMPLE_RATE
            atk = min(1.0, dt / 0.004)
            v = (
                math.sin(TWO_PI * f * dt) * math.exp(-dt * decay)
                + 0.30 * math.sin(TWO_PI * 2.0 * f * dt) * math.exp(-dt * decay * 2.2)
            ) * atk * amp / max(1, len(freqs)) * 1.6
            bl[i] += v * lg
            br[i] += v * rg


def add_kick_and_groove(bl: list[float], br: list[float], t_start: float, t_end: float, amp: float = 0.32):
    beat = 0
    rng = random.Random(77)
    while True:
        tb = t_start + beat * 0.5
        if tb > t_end:
            break
        add_sub_pulse(bl, br, tb, freq=46.0, dur=0.22, amp=amp)
        if tb + 0.25 <= t_end:
            s0 = max(0, int((tb + 0.25) * SAMPLE_RATE))
            s1 = min(len(bl), int((tb + 0.33) * SAMPLE_RATE))
            p1 = p2 = 0.0
            for i in range(s0, s1):
                dt = (i - s0) / SAMPLE_RATE
                r = rng.uniform(-1.0, 1.0)
                hp1 = r - 0.85 * p1
                hp2 = hp1 - 0.75 * p2
                p1, p2 = r, hp1
                v = hp2 * math.exp(-dt * 52.0) * 0.055
                bl[i] += v * 0.85
                br[i] += v * 1.15
        beat += 1


def write_wav(path: str, bl: list[float], br: list[float], fade_out_start_s: float):
    n = len(bl)
    fin = int(0.03 * SAMPLE_RATE)
    fout = int(fade_out_start_s * SAMPLE_RATE)
    pcm = array.array("h")
    for i in range(n):
        l, r = bl[i], br[i]
        if i < fin:
            g = i / max(1, fin)
            l *= g
            r *= g
        elif i >= fout:
            u = (i - fout) / max(1, n - 1 - fout)
            g = 0.5 + 0.5 * math.cos(math.pi * min(1.0, u))
            l *= g
            r *= g
        pcm.append(max(-32767, min(32767, int(math.tanh(l * 0.92) * 31500.0))))
        pcm.append(max(-32767, min(32767, int(math.tanh(r * 0.92) * 31500.0))))
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm.tobytes())
    print(f"SAVED_WAV {path} ({os.path.getsize(path)} bytes, {n / SAMPLE_RATE:.2f}s)")


def build_master_23s() -> str:
    n = int(23.0 * SAMPLE_RATE)
    bl = [0.0] * n
    br = [0.0] * n

    # 0.0 - 3.0s SCENE 1 (Hook Shelf Tension): dark D minor drone + 2s expiry pulse thumps
    add_pad(bl, br, 0.0, 3.2, [73.42, 146.83, 174.61, 220.0], amp=0.14)
    add_sub_pulse(bl, br, 0.05, freq=48.0, dur=0.55, amp=0.26)
    add_sub_pulse(bl, br, 1.00, freq=52.0, dur=0.55, amp=0.30)  # synced to red glow peak
    add_sub_pulse(bl, br, 2.00, freq=48.0, dur=0.55, amp=0.25)
    add_sub_pulse(bl, br, 2.85, freq=56.0, dur=0.45, amp=0.32)

    # 3.0 - 9.0s SCENE 2 & 2B (Night Chemist Counter & Bills Chaos): sparse tense piano + clock ticks + riser
    add_pad(bl, br, 3.0, 5.85, [110.0, 146.83, 174.61, 261.63], amp=0.11)
    for t_tick in [3.25, 3.75, 4.25, 4.75, 5.25, 5.75, 6.25, 6.75, 7.25, 7.75, 8.25]:
        add_tick(bl, br, t_tick, amp=0.075, pan=0.25 if int(t_tick * 4) % 2 else -0.25)
    add_pluck(bl, br, 3.20, 293.66, dur=0.8, amp=0.11, pan=-0.2)
    add_pluck(bl, br, 4.50, 261.63, dur=0.8, amp=0.10, pan=0.2)
    add_pluck(bl, br, 6.10, 220.00, dur=0.8, amp=0.11, pan=-0.2)
    # Riser swoosh into dramatic silence drop right before 9.0s reveal
    add_whoosh(bl, br, 8.85, pre=1.60, post=0.08, amp=0.22, pan=0.0, seed=21)

    # 9.0 - 15.0s SCENE 3 & 3B (Phone Reveal & Spring Notification): crisp fintech beat + chimes
    add_sub_pulse(bl, br, 9.00, freq=55.0, dur=0.6, amp=0.36)
    add_chime(bl, br, 9.02, [440.0, 554.37, 659.25, 880.0], amp=0.22, decay=2.8, stagger=0.03)
    add_pad(bl, br, 9.00, 3.0, [220.0, 277.18, 329.63, 493.88], amp=0.11, pump=True)
    add_pad(bl, br, 12.00, 3.2, [246.94, 329.63, 369.99, 440.0], amp=0.11, pump=True)
    add_kick_and_groove(bl, br, 9.00, 14.80, amp=0.28)
    arp = [440.0, 554.37, 659.25, 880.0]
    t = 9.00
    k = 0
    while t <= 14.75:
        add_pluck(bl, br, t, arp[k % 4], dur=0.32, amp=0.09, pan=-0.3 if k % 2 == 0 else 0.3)
        t += 0.25
        k += 1

    # Scene 3B notification spring card arrival (12.0 + 14/24 = 12.58s)
    add_whoosh(bl, br, 12.50, pre=0.20, post=0.12, amp=0.16, pan=0.2, seed=32)
    add_chime(bl, br, 12.55, [880.0, 1108.73, 1318.51], amp=0.24, decay=3.8, stagger=0.035)

    # 15.0 - 23.0s SCENE 4 (Logo Sting): clean white-to-teal resolve chord + overshoot burst sparkle + hold
    add_whoosh(bl, br, 16.05, pre=0.35, post=0.22, amp=0.18, pan=0.0, seed=41)
    add_sub_pulse(bl, br, 16.08, freq=55.0, dur=0.75, amp=0.32)
    add_pad(bl, br, 15.6, 6.2, [220.0, 277.18, 329.63, 440.0, 659.25], amp=0.13)
    add_chime(bl, br, 16.12, [554.37, 659.25, 880.0, 1108.73, 1318.51], amp=0.26, decay=2.2, stagger=0.04)

    out_path = os.path.join(TEX_DIR, "audio_master_23s.wav")
    write_wav(out_path, bl, br, fade_out_start_s=21.6)
    return out_path


def build_sting_8s() -> str:
    n = int(8.0 * SAMPLE_RATE)
    bl = [0.0] * n
    br = [0.0] * n
    add_whoosh(bl, br, 1.05, pre=0.35, post=0.24, amp=0.18, pan=0.0, seed=91)
    add_sub_pulse(bl, br, 1.08, freq=55.0, dur=0.75, amp=0.34)
    add_pad(bl, br, 0.70, 5.8, [220.0, 277.18, 329.63, 440.0, 659.25], amp=0.13)
    add_chime(bl, br, 1.12, [554.37, 659.25, 880.0, 1108.73, 1318.51], amp=0.28, decay=2.1, stagger=0.04)
    out_path = os.path.join(TEX_DIR, "audio_sting_8s.wav")
    write_wav(out_path, bl, br, fade_out_start_s=6.5)
    return out_path


def main():
    build_master_23s()
    build_sting_8s()


if __name__ == "__main__":
    main()
