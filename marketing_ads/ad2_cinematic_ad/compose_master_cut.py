"""Assemble the 23-second continuous 1920x1080 Master Preview Cut from all 6 rendered
scenes and mux normalized stereo cinema audio (plus standalone sound-enabled Logo Sting renders).
"""

import os
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(BASE_DIR, "textures")
OUT_DIR = os.path.join(BASE_DIR, "outputs")


def mux_audio(video_in: str, wav_in: str, video_out: str) -> None:
    cmd = [
        "ffmpeg", "-y",
        "-i", video_in,
        "-i", wav_in,
        "-filter_complex", "[1:a]loudnorm=I=-14:TP=-1.5:LRA=7[aout]",
        "-map", "0:v:0",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-ar", "44100",
        "-ac", "2",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        video_out,
    ]
    subprocess.run(cmd, check=True)
    print(f"MUXED_AUDIO {video_out} ({os.path.getsize(video_out)} bytes)")


def main() -> None:
    clips = [
        "Scene_1_Hook_3s_1920x1080.mp4",
        "Scene_2_Counter_3s_1920x1080.mp4",
        "Scene_2B_BillsZoom_3s_1920x1080.mp4",
        "Scene_3_PhoneReveal_3s_1920x1080.mp4",
        "Scene_3B_Notification_3s_1920x1080.mp4",
        "Scene_4_LogoSting_8s_1920x1080.mp4",
    ]
    inputs = []
    for c in clips:
        p = os.path.join(OUT_DIR, c)
        if not os.path.exists(p):
            raise FileNotFoundError(f"Missing rendered clip: {p}")
        inputs.extend(["-i", p])

    master_wav = os.path.join(TEX_DIR, "audio_master_23s.wav")
    master_out = os.path.join(OUT_DIR, "StackPharmacy_Master_Cut_23s_1920x1080.mp4")

    concat_v = "".join(f"[{i}:v]" for i in range(len(clips)))
    filter_complex = (
        f"{concat_v}concat=n={len(clips)}:v=1:a=0[vout];"
        f"[{len(clips)}:a]loudnorm=I=-14:TP=-1.5:LRA=7[aout]"
    )
    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-i", master_wav,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "16",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-ar", "44100",
        "-ac", "2",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        master_out,
    ]
    subprocess.run(cmd, check=True)
    print(f"DONE_MASTER {master_out} ({os.path.getsize(master_out)} bytes)")

    # Sound-muxed standalone Logo Sting convenience exports (16:9 & 9:16)
    sting_wav = os.path.join(TEX_DIR, "audio_sting_8s.wav")
    mux_audio(
        os.path.join(OUT_DIR, "Scene_4_LogoSting_8s_1920x1080.mp4"),
        sting_wav,
        os.path.join(OUT_DIR, "Scene_4_LogoSting_WithSound_8s_1920x1080.mp4"),
    )
    mux_audio(
        os.path.join(OUT_DIR, "Scene_4_LogoSting_8s_1080x1920.mp4"),
        sting_wav,
        os.path.join(OUT_DIR, "Scene_4_LogoSting_WithSound_8s_1080x1920.mp4"),
    )


if __name__ == "__main__":
    main()
