"""Synthesize a 9.0-second synced soundtrack + UI/3D SFX WAV for StackPharmacy Reels.

Uses Python standard library only (array, math, random, wave) to render a
44.1 kHz 16-bit stereo WAV aligned frame-by-frame to the 24 fps Blender + FFmpeg
choreography in build_scene.py and render_reels.py.
"""

import array
import math
import os
import random
import wave

SAMPLE_RATE = 44100
DURATION_S = 9.0
NUM_SAMPLES = int(SAMPLE_RATE * DURATION_S)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(BASE_DIR, "textures")
WAV_OUT = os.path.join(TEX_DIR, "reels_soundtrack_9s.wav")

TWO_PI = 2.0 * math.pi


def _clamp_pan(pan: float) -> tuple[float, float]:
    """Return equal-power (left, right) gains for pan in [-1.0, 1.0]."""
    p = max(-1.0, min(1.0, pan))
    angle = (p + 1.0) * (math.pi * 0.25)
    return math.cos(angle), math.sin(angle)


def _mix(buf_l: list[float], buf_r: list[float], idx: int, val: float, lg: float, rg: float) -> None:
    if 0 <= idx < NUM_SAMPLES:
        buf_l[idx] += val * lg
        buf_r[idx] += val * rg


def add_pluck_note(
    buf_l: list[float],
    buf_r: list[float],
    t0: float,
    freq: float,
    dur: float = 0.38,
    amp: float = 0.14,
    pan: float = 0.0,
) -> None:
    """Add a warm low-passed synth pluck with fast-decaying upper harmonics."""
    start = max(0, int(t0 * SAMPLE_RATE))
    end = min(NUM_SAMPLES, int((t0 + dur) * SAMPLE_RATE))
    lg, rg = _clamp_pan(pan)
    atk = max(1, int(0.005 * SAMPLE_RATE))

    for i in range(start, end):
        dt = (i - start) / SAMPLE_RATE
        env_a = min(1.0, (i - start) / atk)
        e1 = math.exp(-dt * 8.5)
        e2 = math.exp(-dt * 16.0)
        e3 = math.exp(-dt * 26.0)
        ph = TWO_PI * freq * dt
        s = (
            math.sin(ph) * e1
            + 0.42 * math.sin(2.0 * ph) * e2
            + 0.16 * math.sin(3.0 * ph) * e3
        ) * (amp * env_a)
        buf_l[i] += s * lg
        buf_r[i] += s * rg


def add_pad_chord(
    buf_l: list[float],
    buf_r: list[float],
    t0: float,
    dur: float,
    freqs: list[float],
    amp: float = 0.055,
) -> None:
    """Add a lush stereo warm chord pad with subtle slow chorus detune."""
    start = max(0, int(t0 * SAMPLE_RATE))
    end = min(NUM_SAMPLES, int((t0 + dur) * SAMPLE_RATE))
    atk_s = min(0.18, dur * 0.25)
    rel_s = min(0.28, dur * 0.30)

    for i in range(start, end):
        dt = (i - start) / SAMPLE_RATE
        rem = dur - dt
        env = 1.0
        if dt < atk_s:
            env *= 0.5 - 0.5 * math.cos(math.pi * dt / atk_s)
        if rem < rel_s:
            env *= 0.5 - 0.5 * math.cos(math.pi * max(0.0, rem) / rel_s)

        # Light kick-sync pump every 0.5s (120 BPM) for modern commercial bounce
        beat_pos = (i / SAMPLE_RATE) % 0.5
        duck = 0.62 + 0.38 * min(1.0, beat_pos / 0.14)

        sl = 0.0
        sr = 0.0
        for k, f in enumerate(freqs):
            det = 0.35 if (k % 2 == 0) else -0.35
            sl += math.sin(TWO_PI * (f + det) * dt) + 0.18 * math.sin(TWO_PI * 2.0 * f * dt)
            sr += math.sin(TWO_PI * (f - det) * dt) + 0.18 * math.sin(TWO_PI * 2.0 * f * dt)

        scale = (amp / len(freqs)) * env * duck
        buf_l[i] += sl * scale
        buf_r[i] += sr * scale


def add_bass_note(
    buf_l: list[float],
    buf_r: list[float],
    t0: float,
    freq: float,
    dur: float,
    amp: float = 0.16,
) -> None:
    """Add a clean warm sub/mid-bass note."""
    start = max(0, int(t0 * SAMPLE_RATE))
    end = min(NUM_SAMPLES, int((t0 + dur) * SAMPLE_RATE))
    atk = max(1, int(0.008 * SAMPLE_RATE))

    for i in range(start, end):
        dt = (i - start) / SAMPLE_RATE
        env_a = min(1.0, (i - start) / atk)
        env_d = math.exp(-dt * 2.6) * min(1.0, max(0.0, (dur - dt) / 0.04))
        ph = TWO_PI * freq * dt
        s = (0.78 * math.sin(ph) + 0.28 * math.sin(2.0 * ph) * math.exp(-dt * 6.0)) * (
            amp * env_a * env_d
        )
        buf_l[i] += s
        buf_r[i] += s


def add_kick(buf_l: list[float], buf_r: list[float], t0: float, amp: float = 0.36) -> None:
    """Add a tight modern pop/tech kick drum with pitch envelope."""
    dur = 0.19
    start = max(0, int(t0 * SAMPLE_RATE))
    end = min(NUM_SAMPLES, int((t0 + dur) * SAMPLE_RATE))
    phase = 0.0
    for i in range(start, end):
        dt = (i - start) / SAMPLE_RATE
        f = 46.0 + 115.0 * math.exp(-dt * 42.0)
        phase += TWO_PI * f / SAMPLE_RATE
        env = math.exp(-dt * 16.0) * min(1.0, dt / 0.002)
        click = math.exp(-dt * 220.0) * 0.25 * math.sin(TWO_PI * 1900.0 * dt)
        s = (math.sin(phase) * env + click) * amp
        buf_l[i] += s
        buf_r[i] += s


def add_hihat(
    buf_l: list[float],
    buf_r: list[float],
    t0: float,
    amp: float = 0.075,
    decay: float = 48.0,
    pan: float = 0.18,
    rng: random.Random | None = None,
) -> None:
    """Add a crisp high-passed closed hi-hat / shaker."""
    dur = 0.09
    start = max(0, int(t0 * SAMPLE_RATE))
    end = min(NUM_SAMPLES, int((t0 + dur) * SAMPLE_RATE))
    lg, rg = _clamp_pan(pan)
    r = rng or random.Random(int(t0 * 1000))
    prev = 0.0
    prev2 = 0.0
    for i in range(start, end):
        dt = (i - start) / SAMPLE_RATE
        n = r.uniform(-1.0, 1.0)
        # Double differentiation strongly high-passes white noise (>6 kHz sheen)
        hp1 = n - 0.85 * prev
        hp2 = hp1 - 0.75 * prev2
        prev = n
        prev2 = hp1
        env = math.exp(-dt * decay)
        s = hp2 * env * amp
        buf_l[i] += s * lg
        buf_r[i] += s * rg


def add_snap(buf_l: list[float], buf_r: list[float], t0: float, amp: float = 0.14) -> None:
    """Add a tight woody finger-snap / soft clap on backbeats."""
    dur = 0.11
    start = max(0, int(t0 * SAMPLE_RATE))
    end = min(NUM_SAMPLES, int((t0 + dur) * SAMPLE_RATE))
    r = random.Random(int(t0 * 10000) + 7)
    bp_y1 = 0.0
    bp_y2 = 0.0
    for i in range(start, end):
        dt = (i - start) / SAMPLE_RATE
        n = r.uniform(-1.0, 1.0)
        # Simple 2nd-order resonant bandpass feel around ~1.8 kHz
        bp_y1 = 0.72 * bp_y1 + 0.28 * n
        hp = n - bp_y1
        bp_y2 = 0.55 * bp_y2 + 0.45 * hp
        burst = math.exp(-dt * 44.0) + 0.35 * math.exp(-abs(dt - 0.012) * 140.0)
        body = math.sin(TWO_PI * (1450.0 * math.exp(-dt * 12.0)) * dt) * math.exp(-dt * 55.0) * 0.45
        s = (bp_y2 * burst * 0.9 + body) * amp
        buf_l[i] += s * 0.95
        buf_r[i] += s * 1.05


def add_pop_bloop(
    buf_l: list[float],
    buf_r: list[float],
    t0: float,
    f_start: float,
    f_end: float,
    dur: float = 0.11,
    amp: float = 0.24,
    pan: float = 0.0,
) -> None:
    """Add a crisp upward-swept UI/3D pop-in bubble + soft click transient."""
    start = max(0, int(t0 * SAMPLE_RATE))
    end = min(NUM_SAMPLES, int((t0 + dur) * SAMPLE_RATE))
    lg, rg = _clamp_pan(pan)
    phase = 0.0
    for i in range(start, end):
        dt = (i - start) / SAMPLE_RATE
        prog = min(1.0, dt / dur)
        # Fast ease-out frequency glide for elastic pop feel
        eased = 1.0 - (1.0 - prog) ** 3
        f = f_start + (f_end - f_start) * eased
        phase += TWO_PI * f / SAMPLE_RATE
        env = math.sin(math.pi * min(1.0, dt / 0.014)) if dt < 0.007 else math.exp(-(dt - 0.007) * 28.0)
        overtone = 0.25 * math.sin(2.0 * phase) * math.exp(-dt * 45.0)
        s = (math.sin(phase) + overtone) * env * amp
        buf_l[i] += s * lg
        buf_r[i] += s * rg


def add_whoosh(
    buf_l: list[float],
    buf_r: list[float],
    t_peak: float,
    pre_dur: float = 0.16,
    post_dur: float = 0.12,
    amp: float = 0.15,
    pan: float = 0.0,
) -> None:
    """Add an airy filtered swoosh peaking at t_peak."""
    start = max(0, int((t_peak - pre_dur) * SAMPLE_RATE))
    peak_idx = int(t_peak * SAMPLE_RATE)
    end = min(NUM_SAMPLES, int((t_peak + post_dur) * SAMPLE_RATE))
    lg, rg = _clamp_pan(pan)
    r = random.Random(int(t_peak * 1000) + 99)
    lp = 0.0
    hp_prev = 0.0
    for i in range(start, end):
        t = i / SAMPLE_RATE
        if i <= peak_idx:
            u = (t - (t_peak - pre_dur)) / max(1e-5, pre_dur)
            env = u * u
        else:
            u = (t - t_peak) / max(1e-5, post_dur)
            env = math.exp(-u * 5.0)
        n = r.uniform(-1.0, 1.0)
        # Moving brightness coefficient sweeps up into the peak
        alpha = 0.08 + 0.28 * env
        lp += alpha * (n - lp)
        bp = lp - 0.72 * hp_prev
        hp_prev = lp
        s = bp * env * amp
        buf_l[i] += s * lg
        buf_r[i] += s * rg


def add_laser_scan(
    buf_l: list[float],
    buf_r: list[float],
    t0: float = 2.45,
    dur: float = 0.96,
    amp: float = 0.17,
) -> None:
    """Add a futuristic shimmering AI beam scan sweep synced to frames 59..82."""
    start = max(0, int(t0 * SAMPLE_RATE))
    end = min(NUM_SAMPLES, int((t0 + dur) * SAMPLE_RATE))
    ph1 = 0.0
    ph2 = 0.0
    for i in range(start, end):
        dt = (i - start) / SAMPLE_RATE
        u = dt / dur
        # Smooth bell envelope over scan window
        env = math.sin(math.pi * u) ** 0.75
        # Sweeps down-then-up smoothly like an optical scanner locking focus
        freq = 540.0 + 480.0 * math.sin(math.pi * u) + 320.0 * u
        mod = 1.0 + 0.18 * math.sin(TWO_PI * 18.0 * dt)
        ph1 += TWO_PI * freq / SAMPLE_RATE
        ph2 += TWO_PI * (freq * 1.5) / SAMPLE_RATE
        sig = (0.7 * math.sin(ph1) + 0.3 * math.sin(ph2) * mod) * env * amp
        pan = -0.35 + 0.55 * u
        lg, rg = _clamp_pan(pan)
        buf_l[i] += sig * lg
        buf_r[i] += sig * rg


def add_chime(
    buf_l: list[float],
    buf_r: list[float],
    t0: float,
    freqs: list[float],
    amp: float = 0.20,
    decay: float = 4.2,
    stagger: float = 0.035,
) -> None:
    """Add a bright crystalline glass/bell confirmation chime."""
    for idx, f in enumerate(freqs):
        ft = t0 + idx * stagger
        start = max(0, int(ft * SAMPLE_RATE))
        end = min(NUM_SAMPLES, int((ft + 1.1) * SAMPLE_RATE))
        pan = -0.22 + 0.22 * idx
        lg, rg = _clamp_pan(pan)
        for i in range(start, end):
            dt = (i - start) / SAMPLE_RATE
            atk = min(1.0, dt / 0.004)
            s = (
                math.sin(TWO_PI * f * dt) * math.exp(-dt * decay)
                + 0.35 * math.sin(TWO_PI * (2.0 * f) * dt) * math.exp(-dt * decay * 2.2)
                + 0.14 * math.sin(TWO_PI * (3.0 * f) * dt) * math.exp(-dt * decay * 3.8)
            ) * (atk * amp / len(freqs) * 1.55)
            buf_l[i] += s * lg
            buf_r[i] += s * rg


def apply_ping_pong_delay(buf_l: list[float], buf_r: list[float], delay_s: float = 0.375, wet: float = 0.26) -> None:
    """Apply subtle dotted-8th stereo echo to melodic content for commercial polish."""
    d = int(delay_s * SAMPLE_RATE)
    for i in range(d, NUM_SAMPLES):
        buf_l[i] += buf_r[i - d] * wet
        buf_r[i] += buf_l[i - d] * (wet * 0.85)


def build_soundtrack() -> tuple[list[float], list[float]]:
    music_l = [0.0] * NUM_SAMPLES
    music_r = [0.0] * NUM_SAMPLES
    sfx_l = [0.0] * NUM_SAMPLES
    sfx_r = [0.0] * NUM_SAMPLES

    # 1. Chord Pad & Bass Progression (Key: A Major @ 120 BPM)
    # Bars: [0..2s] Amaj9 | [2..4s] Eadd9 | [4..6s] F#m7 | [6..7.5s] Dmaj9 | [7.5..9s] A resolve
    chords = [
        (0.00, 2.00, [220.0, 277.18, 329.63, 493.88], 110.00),   # Amaj9 (bass A2)
        (2.00, 2.00, [246.94, 329.63, 369.99, 415.30], 82.41),   # Eadd9 (bass E2)
        (4.00, 2.00, [220.00, 277.18, 329.63, 369.99], 92.50),   # F#m7  (bass F#2)
        (6.00, 1.50, [220.00, 293.66, 329.63, 369.99], 73.42),   # Dmaj9 (bass D2)
        (7.50, 1.50, [220.00, 277.18, 329.63, 440.00], 110.00),  # Amaj  (bass A2)
    ]
    for t0, dur, freqs, bass_f in chords:
        add_pad_chord(music_l, music_r, t0, dur, freqs, amp=0.085)
        # Rhythmic pulsing eighth/quarter bass notes
        t_cur = t0
        step = 0
        while t_cur < t0 + dur - 0.15:
            note_dur = 0.45 if step % 2 == 0 else 0.42
            add_bass_note(music_l, music_r, t_cur, bass_f, min(note_dur, t0 + dur - t_cur), amp=0.17)
            t_cur += 0.50
            step += 1

    # 2. Bright Pluck Arpeggio (0.25s eighth-note groove through 8.25s)
    arp_patterns = [
        [440.00, 554.37, 659.25, 493.88],  # A4 C#5 E5 B4
        [493.88, 659.25, 739.99, 830.61],  # B4 E5 F#5 G#5
        [440.00, 554.37, 659.25, 739.99],  # A4 C#5 E5 F#5
        [440.00, 587.33, 659.25, 739.99],  # A4 D5 E5 F#5
        [440.00, 554.37, 659.25, 880.00],  # A4 C#5 E5 A5
    ]
    t = 0.0
    step_idx = 0
    while t <= 8.25:
        if t < 2.0:
            pat = arp_patterns[0]
        elif t < 4.0:
            pat = arp_patterns[1]
        elif t < 6.0:
            pat = arp_patterns[2]
        elif t < 7.5:
            pat = arp_patterns[3]
        else:
            pat = arp_patterns[4]
        freq = pat[step_idx % len(pat)]
        pan = -0.35 if (step_idx % 2 == 0) else 0.35
        amp = 0.115 if (step_idx % 2 == 0) else 0.08
        add_pluck_note(music_l, music_r, t, freq, dur=0.34, amp=amp, pan=pan)
        t += 0.25
        step_idx += 1

    # Add spatial ping-pong echo ONLY to melodic synth bed before drums
    apply_ping_pong_delay(music_l, music_r, delay_s=0.375, wet=0.22)

    # 3. Tight Modern Drum Groove @ 120 BPM (0.50s beat grid, ends cleanly at 8.0s impact)
    rng_hat = random.Random(42)
    beat = 0
    while beat * 0.5 <= 8.05:
        tb = beat * 0.5
        # Soft punchy kick on every beat, double kick accent into CTA (6.5s)
        add_kick(sfx_l, sfx_r, tb, amp=0.34 if beat < 16 else 0.38)
        if beat % 2 == 1 and tb < 8.0:
            add_snap(sfx_l, sfx_r, tb, amp=0.13)
        if tb < 7.9:
            add_hihat(sfx_l, sfx_r, tb + 0.25, amp=0.068, decay=52.0, pan=0.22, rng=rng_hat)
        beat += 1

    # 4. Synced 3D & Kinetic UI Pop-Up SFX (exact timestamps from build_scene.py / render_reels.py)
    # 0.17s: STACKPHARMACY 3D pedestal + top header "Bill Photo Khicho."
    add_whoosh(sfx_l, sfx_r, 0.18, pre_dur=0.15, post_dur=0.12, amp=0.16, pan=0.0)
    add_pop_bloop(sfx_l, sfx_r, 0.18, 390.0, 740.0, dur=0.12, amp=0.24, pan=0.0)

    # 0.75s: Paper Distributor Bill pop-in
    add_whoosh(sfx_l, sfx_r, 0.75, pre_dur=0.12, post_dur=0.10, amp=0.13, pan=-0.35)
    add_pop_bloop(sfx_l, sfx_r, 0.75, 440.0, 680.0, dur=0.11, amp=0.22, pan=-0.35)

    # 1.17s: Amber Syrup Bottle pop-in
    add_pop_bloop(sfx_l, sfx_r, 1.17, 500.0, 820.0, dur=0.10, amp=0.21, pan=-0.45)

    # 1.42s: DOLO-650 Medicine Box pop-in
    add_pop_bloop(sfx_l, sfx_r, 1.42, 560.0, 920.0, dur=0.10, amp=0.21, pan=0.45)

    # 1.67s, 1.83s, 2.00s: 3 Capsules triad pops + Hero Phone & "Stock Auto-Ready!"
    add_pop_bloop(sfx_l, sfx_r, 1.67, 520.0, 659.25, dur=0.09, amp=0.18, pan=-0.25)
    add_pop_bloop(sfx_l, sfx_r, 1.83, 620.0, 830.61, dur=0.09, amp=0.19, pan=0.0)
    add_whoosh(sfx_l, sfx_r, 2.00, pre_dur=0.16, post_dur=0.14, amp=0.18, pan=0.05)
    add_pop_bloop(sfx_l, sfx_r, 2.00, 660.0, 987.77, dur=0.12, amp=0.25, pan=0.05)

    # 2.45s - 3.41s: AI Cyan Laser Scan Sweep across the distributor invoice
    add_laser_scan(sfx_l, sfx_r, t0=2.45, dur=0.96, amp=0.18)

    # 3.45s: Phone screen flips to "✓ AI Scan Complete — 0.8s" -> Bright confirmation chime!
    add_chime(sfx_l, sfx_r, 3.45, [880.00, 1108.73, 1318.51, 1760.00], amp=0.25, decay=4.0, stagger=0.03)

    # 4.20s, 5.10s, 6.00s: Three floating Feature Pills ("0% Manual Typing", "Expiry Loss = ZERO", "1-Tap WhatsApp Bills")
    add_pop_bloop(sfx_l, sfx_r, 4.20, 650.0, 880.00, dur=0.10, amp=0.22, pan=-0.40)
    add_pop_bloop(sfx_l, sfx_r, 5.10, 740.0, 987.77, dur=0.10, amp=0.22, pan=-0.38)
    add_pop_bloop(sfx_l, sfx_r, 6.00, 830.0, 1174.66, dur=0.10, amp=0.23, pan=-0.35)

    # 6.75s: Bottom Offer CTA Lockup ("1ST MONTH FREE • Then ₹599/month • Try Free Now")
    add_whoosh(sfx_l, sfx_r, 6.75, pre_dur=0.20, post_dur=0.18, amp=0.20, pan=0.0)
    add_kick(sfx_l, sfx_r, 6.75, amp=0.30)
    add_chime(sfx_l, sfx_r, 6.76, [659.25, 880.00, 1108.73, 1318.51], amp=0.26, decay=3.2, stagger=0.028)

    # Final ring-out sparkle on final beat (8.00s)
    add_chime(sfx_l, sfx_r, 8.00, [880.00, 1318.51], amp=0.14, decay=3.6, stagger=0.04)

    # Combine music + SFX with DC-block, smooth ending fade-out, and soft tape saturation
    out_l = [0.0] * NUM_SAMPLES
    out_r = [0.0] * NUM_SAMPLES
    fade_in_end = int(0.025 * SAMPLE_RATE)
    fade_out_start = int(8.62 * SAMPLE_RATE)

    for i in range(NUM_SAMPLES):
        l = music_l[i] + sfx_l[i]
        r = music_r[i] + sfx_r[i]
        if i < fade_in_end:
            g = i / fade_in_end
            l *= g
            r *= g
        elif i >= fade_out_start:
            u = (i - fade_out_start) / max(1, NUM_SAMPLES - 1 - fade_out_start)
            g = 0.5 + 0.5 * math.cos(math.pi * min(1.0, u))
            l *= g
            r *= g
        # Soft-clip saturation prevents any transient harshness
        out_l[i] = math.tanh(l * 0.92)
        out_r[i] = math.tanh(r * 0.92)

    return out_l, out_r


def main() -> str:
    os.makedirs(TEX_DIR, exist_ok=True)
    out_l, out_r = build_soundtrack()

    pcm = array.array("h")
    for l, r in zip(out_l, out_r):
        pcm.append(max(-32767, min(32767, int(l * 31500.0))))
        pcm.append(max(-32767, min(32767, int(r * 31500.0))))

    with wave.open(WAV_OUT, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm.tobytes())

    size_bytes = os.path.getsize(WAV_OUT)
    print(f"SAVED {WAV_OUT} ({size_bytes} bytes, {DURATION_S:.2f}s stereo 44.1kHz)")
    return WAV_OUT


if __name__ == "__main__":
    main()
