"""
Synthesizes an 8.0-second seamless loopable studio beat & soft mechanical card-glide
SFX track (44.1 kHz stereo WAV) synced cleanly to 6 card cascades @ 30fps (1.333s each).
"""

import math
import os
import struct
import wave

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(BASE_DIR, "textures")
os.makedirs(TEX_DIR, exist_ok=True)

SR = 44100
DUR = 8.0
N = int(SR * DUR)


def clamp(v: float) -> float:
    return max(-1.0, min(1.0, v))


def main():
    left = [0.0] * N
    right = [0.0] * N

    # Minimal 90-BPM / 1.333s card beat chord progression (F# minor / Emerald vibe: F#3, D3, A3, E3)
    slot_dur = DUR / 6.0  # 1.3333s per card cascade
    chords = [
        (185.00, 277.18, 369.99),  # Card 1: F#m
        (146.83, 220.00, 329.63),  # Card 2: Dmaj9
        (220.00, 277.18, 440.00),  # Card 3: A
        (164.81, 246.94, 329.63),  # Card 4: Emaj/Em
        (146.83, 220.00, 369.99),  # Card 5: Dmaj7
        (185.00, 277.18, 440.00),  # Card 6: F#m7
    ]

    # Pre-seeded fast deterministic PRNG for soft airy swoosh texture
    seed = 13579
    def next_noise():
        nonlocal seed
        seed = (1664525 * seed + 1013904223) & 0xFFFFFFFF
        return (seed / 2147483648.0) - 1.0

    # 1. Warm sub-bass pulse + airy pad + 6 card-glide swooshes & soft clicks
    prev_n = 0.0
    for i in range(N):
        t = i / SR
        slot_idx = int(t / slot_dur) % 6
        local_t = t - int(t / slot_dur) * slot_dur
        f_bass, f_mid, f_hi = chords[slot_idx]

        # Warm sub kick on every card transition (local_t near 0)
        kick_env = math.exp(-local_t * 14.0) if local_t < 0.35 else 0.0
        kick_freq = 48.0 + 95.0 * math.exp(-local_t * 36.0)
        kick = math.sin(2.0 * math.pi * kick_freq * local_t) * kick_env * 0.42

        # Warm electric pluck chord on card landing
        pad_env = min(1.0, local_t / 0.03) * math.exp(-local_t * 2.2)
        pad = (
            0.22 * math.sin(2.0 * math.pi * f_bass * t)
            + 0.14 * math.sin(2.0 * math.pi * f_mid * t)
            + 0.10 * math.sin(2.0 * math.pi * f_hi * t)
        ) * pad_env

        # Subtle half-beat marimba/UI tick at local_t = 0.666s
        ht = local_t - slot_dur * 0.5
        tick = 0.0
        if 0.0 <= ht < 0.12:
            tick = math.sin(2.0 * math.pi * (f_hi * 2.0) * ht) * math.exp(-ht * 45.0) * 0.14

        # Filtered airy card-slide swoosh leading slightly into next beat
        raw_n = next_noise()
        prev_n = 0.85 * prev_n + 0.15 * raw_n
        swoosh_env = math.exp(-((local_t - 0.12) ** 2) / (2 * 0.065 ** 2))
        swoosh = prev_n * swoosh_env * 0.16

        # Crisp UI snap at card focus peak
        snap = 0.0
        if local_t < 0.045:
            snap = math.sin(2.0 * math.pi * 1480.0 * local_t) * math.exp(-local_t * 110.0) * 0.15

        # Gentle seamless fade at 0..0.04s & 7.96..8.00s so loop never pops
        loop_fade = 1.0
        if t < 0.03:
            loop_fade = t / 0.03
        elif t > DUR - 0.03:
            loop_fade = (DUR - t) / 0.03

        mix = kick + pad + swoosh + snap
        left[i] = clamp((mix + tick * 0.6) * loop_fade)
        right[i] = clamp((mix - tick * 0.3 + swoosh * 0.15) * loop_fade)

    wav_path = os.path.join(TEX_DIR, "audio_cascade_8s.wav")
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        frames = bytearray()
        for l, r in zip(left, right):
            frames.extend(struct.pack("<hh", int(l * 30000), int(r * 30000)))
        wf.writeframes(bytes(frames))

    print("GENERATED_AUDIO:", wav_path, os.path.getsize(wav_path))
    return wav_path


if __name__ == "__main__":
    main()
