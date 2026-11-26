"""
Synthesizes an 8.0-second seamless loopable studio beat & silky accordion-glide
SFX track (44.1 kHz stereo WAV) synced cleanly to the Up <-> Down card cascade.
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

    # 4 two-second bars (120 BPM quarter-note feel) synced to:
    # 0..4s UP glide + apex, 4..8s DOWN glide + settle
    bars = [
        (185.00, 277.18, 369.99),  # Bar 1 (0..2s): F#m rising
        (220.00, 277.18, 440.00),  # Bar 2 (2..4s): A apex bloom
        (146.83, 220.00, 369.99),  # Bar 3 (4..6s): Dmaj7 returning down
        (164.81, 246.94, 329.63),  # Bar 4 (6..8s): Em settle -> loop back
    ]

    seed = 13579

    def next_noise():
        nonlocal seed
        seed = (1664525 * seed + 1013904223) & 0xFFFFFFFF
        return (seed / 2147483648.0) - 1.0

    prev_n = 0.0
    prev_n2 = 0.0
    for i in range(N):
        t = i / SR
        bar_idx = int(t / 2.0) % 4
        local_bar = t - bar_idx * 2.0
        beat_idx = int(t / 0.5)
        local_beat = t - beat_idx * 0.5
        f_bass, f_mid, f_hi = bars[bar_idx]

        # Soft warm pulse every 1.0s
        one_sec = t - int(t) * 1.0
        kick_env = math.exp(-one_sec * 12.0) if one_sec < 0.35 else 0.0
        kick_freq = 48.0 + 78.0 * math.exp(-one_sec * 32.0)
        kick = math.sin(2.0 * math.pi * kick_freq * one_sec) * kick_env * 0.36

        # Smooth lush pad swell per 2s phrase
        pad_env = min(1.0, local_bar / 0.08) * math.exp(-local_bar * 0.95)
        pad = (
            0.22 * math.sin(2.0 * math.pi * f_bass * t)
            + 0.14 * math.sin(2.0 * math.pi * f_mid * t)
            + 0.10 * math.sin(2.0 * math.pi * f_hi * t)
        ) * pad_env

        # Delicate high harmonic pluck on every 0.5s rhythm pulse
        tick = math.sin(2.0 * math.pi * (f_hi * 2.0) * local_beat) * math.exp(-local_beat * 28.0) * 0.09

        # Two long, velvety air swooshes synced to Up glide (~1.5s) and Down glide (~5.5s)
        raw_n = next_noise()
        prev_n = 0.92 * prev_n + 0.08 * raw_n
        prev_n2 = 0.90 * prev_n2 + 0.10 * prev_n
        swoosh_up = math.exp(-((t - 1.6) ** 2) / (2 * 0.55 ** 2))
        swoosh_dn = math.exp(-((t - 5.6) ** 2) / (2 * 0.55 ** 2))
        swoosh = prev_n2 * (swoosh_up + swoosh_dn) * 0.28

        # Subtle crystalline glint when hitting apex (t=3.5s) and base settle (t=7.5s)
        glint = 0.0
        for g_t in (3.5, 7.5):
            dt = t - g_t
            if 0.0 <= dt < 0.25:
                glint += math.sin(2.0 * math.pi * 1318.5 * dt) * math.exp(-dt * 24.0) * 0.09

        loop_fade = 1.0
        if t < 0.03:
            loop_fade = t / 0.03
        elif t > DUR - 0.03:
            loop_fade = (DUR - t) / 0.03

        mix = kick + pad + swoosh + glint
        pan = math.sin(2.0 * math.pi * (t / DUR))
        left[i] = clamp((mix + tick * (0.7 - 0.3 * pan)) * loop_fade)
        right[i] = clamp((mix + tick * (0.7 + 0.3 * pan)) * loop_fade)

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
