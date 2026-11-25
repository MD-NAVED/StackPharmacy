"""Orchestrator for Ad #2: builds all 6 Blender scenes, supports fast single-frame
preview checks or full 24fps MP4 renders (7 CapCut clips + stitched master cut).
Runs inside Blender via: blender --background --python render_pipeline.py -- [preview|render_12|render_34|all]
"""

import os
import sys
import bpy

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)

import blender_common as bc
from build_scene_1_hook import build_scene_1
from build_scene_2_counter import build_scene_2
from build_scene_2b_bills_zoom import build_scene_2b
from build_scene_3_phone import build_scene_3
from build_scene_3b_notifications import build_scene_3b
from build_scene_4_sting import create_logo_sting_scene


def render_still_preview(blend_name: str, frame: int, out_png: str):
    scene = bpy.context.scene
    scene.frame_set(frame)
    prev_dir = os.path.join(bc.OUT_DIR, "previews")
    os.makedirs(prev_dir, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(bc.SCENES_DIR, blend_name))
    scene.render.filepath = os.path.join(prev_dir, out_png)
    bpy.ops.render.render(write_still=True)


def run_preview_all():
    build_scene_1(render=False)
    render_still_preview("Scene_1_Hook.blend", 72, "prev_1_hook_f72.png")

    build_scene_2(render=False)
    render_still_preview("Scene_2_Counter.blend", 24, "prev_2_counter_f24.png")

    build_scene_2b(render=False)
    render_still_preview("Scene_2B_BillsZoom.blend", 72, "prev_2b_bills_f72.png")

    build_scene_3(render=False)
    render_still_preview("Scene_3_PhoneReveal.blend", 36, "prev_3_phone_f36.png")

    build_scene_3b(render=False)
    render_still_preview("Scene_3B_Notification.blend", 50, "prev_3b_notif_f50.png")

    create_logo_sting_scene(is_vertical=False, render=False)
    render_still_preview("Scene_4_LogoSting_16x9.blend", 42, "prev_4_sting_16x9_f42.png")

    create_logo_sting_scene(is_vertical=True, render=False)
    render_still_preview("Scene_4_LogoSting_9x16.blend", 160, "prev_4_sting_9x16_f160.png")
    print("ALL_7_PREVIEWS_DONE")


def main():
    argv = sys.argv
    mode = argv[argv.index("--") + 1] if "--" in argv and len(argv) > argv.index("--") + 1 else "preview"
    if mode == "preview":
        run_preview_all()
    elif mode == "render_12":
        build_scene_1(render=True)
        build_scene_2(render=True)
        build_scene_2b(render=True)
    elif mode == "render_34":
        build_scene_3(render=True)
        build_scene_3b(render=True)
        create_logo_sting_scene(is_vertical=False, render=True)
        create_logo_sting_scene(is_vertical=True, render=True)
    elif mode == "all":
        build_scene_1(render=True)
        build_scene_2(render=True)
        build_scene_2b(render=True)
        build_scene_3(render=True)
        build_scene_3b(render=True)
        create_logo_sting_scene(is_vertical=False, render=True)
        create_logo_sting_scene(is_vertical=True, render=True)
    else:
        raise ValueError(f"Unknown mode: {mode}")


if __name__ == "__main__":
    main()
