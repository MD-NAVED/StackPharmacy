"""
Renders the 9-second staggered pop-up Reels video ad (216 frames @ 24fps, 1080x1920)
using Blender 5.2 EEVEE on GPU and composites 6 kinetic timed overlay layers via FFmpeg.
"""
import os
import subprocess
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)

import generate_audio
BLEND_FILE = os.path.join(DIR, "StackPharmacy_Ad_Studio.blend")
OUT_DIR = os.path.join(DIR, "outputs")
FRAMES_DIR = os.path.join(OUT_DIR, "reels_frames")
TEX_DIR = os.path.join(DIR, "textures")
MP4_OUT = os.path.join(OUT_DIR, "StackPharmacy_Ad_Reels_1080x1920.mp4")
BLENDER_EXE = r"F:\Program Files\Blender Foundation\Blender 5.2\blender.exe"


def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    blender_script = rf"""
import bpy
bpy.ops.wm.open_mainfile(filepath=r"{BLEND_FILE}")
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 12
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 216
scene.camera = bpy.data.objects['Cam_Reels_Vertical']
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = r"{FRAMES_DIR}\frame_"
bpy.ops.render.render(animation=True)
print("EEVEE_POPUP_FRAMES_DONE")
"""
    tmp_py = os.path.join(DIR, "_render_reels_tmp.py")
    with open(tmp_py, "w", encoding="utf-8") as f:
        f.write(blender_script)

    try:
        print("[1/3] Rendering 216 staggered pop-up 9:16 frames with Blender 5.2 EEVEE...")
        subprocess.run([BLENDER_EXE, "--background", "--python", tmp_py], check=True)
    finally:
        if os.path.exists(tmp_py):
            os.remove(tmp_py)

    print("[2/3] Synthesizing synced 9s soundtrack + UI/3D SFX WAV...")
    wav_path = generate_audio.main()

    # Timed slide-up pop-in filter chain for 6 kinetic UI/offer layers
    layers = [
        ("reels_layer_1_brand.png", 0.20, 48),
        ("reels_layer_2_sub.png",   2.00, 48),
        ("reels_layer_3_pill1.png", 4.20, 40),
        ("reels_layer_4_pill2.png", 5.10, 40),
        ("reels_layer_5_pill3.png", 6.00, 40),
        ("reels_layer_6_cta.png",   6.75, 70),
    ]

    inputs = ["-framerate", "24", "-i", os.path.join(FRAMES_DIR, "frame_%04d.png")]
    filter_parts = []
    prev_label = "0:v"

    for idx, (fname, start_s, slide_px) in enumerate(layers, start=1):
        inputs.extend(["-loop", "1", "-t", "9.0", "-i", os.path.join(TEX_DIR, fname)])
        out_label = "out" if idx == len(layers) else f"v{idx}"
        # Smooth cubic ease-out pop-up from +slide_px -> 0 over 0.28s starting at start_s
        y_expr = f"if(lt(t-{start_s:.2f},0.28),(1-pow(1-(t-{start_s:.2f})/0.28,3))*{slide_px},0)"
        filter_parts.append(
            f"[{prev_label}][{idx}:v]overlay=x=0:y='{y_expr}':enable='gte(t,{start_s:.2f})':format=auto[{out_label}]"
        )
        prev_label = out_label

    audio_idx = len(layers) + 1
    inputs.extend(["-i", wav_path])
    filter_parts.append(f"[{audio_idx}:a]loudnorm=I=-14:TP=-1.5:LRA=7[aout]")
    filter_complex = ";".join(filter_parts)

    print("[3/3] Compositing 6 timed pop-up UI/Offer layers + AAC audio via FFmpeg -> MP4...")
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-map", "[aout]",
        "-t", "9.0",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-ar", "44100",
        "-ac", "2",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        MP4_OUT,
    ]
    subprocess.run(ffmpeg_cmd, check=True)
    print("DONE! Saved 9s pop-up Reels video ad with audio:", MP4_OUT)


if __name__ == "__main__":
    main()
