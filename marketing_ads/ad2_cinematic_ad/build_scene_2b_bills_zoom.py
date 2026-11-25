"""SCENE 2B — PROBLEM (bills pile zoom): Overhead top-down shot of the same
messy night counter with 14+ scattered distributor bills, calculator, and strips,
starting tight and zooming smoothly out over 3s to reveal full chaos.
"""

import math
import os
import sys
import bpy

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)

import blender_common as bc
from build_scene_2_counter import build_counter_environment


def build_scene_2b(render: bool = True):
    scene = bc.reset_scene(fps=24, frame_start=1, frame_end=72, res_x=1920, res_y=1080, samples=16)
    bc.set_dark_world(scene, color=(0.010, 0.015, 0.022), strength=0.22)
    bc.setup_compositor(scene, glare_strength=0.40, glare_threshold=1.0, glare_size=0.55, grain_strength=0.022, frame_end=72)

    build_counter_environment(scene)

    # Extra perimeter bills & two fallen carton boxes to sell 10-15 invoice sprawl when zoomed wide
    extra_mats = [
        bc.make_image_mat(f"Bill_Extra_{i}", f"distributor_bill_{(i % 3) + 1}.png", roughness=0.82)
        for i in range(3)
    ]
    extra_placements = [
        (-0.56, -0.24, 0.005, 48.0),
        (0.55, -0.18, 0.006, -42.0),
        (-0.52, 0.34, 0.004, -22.0),
        (0.48, 0.32, 0.005, 29.0),
    ]
    for idx, (bx, by, bz, rdeg) in enumerate(extra_placements):
        bc.create_beveled_plane(
            scene,
            f"Invoice_Overflow_{idx}",
            0.22,
            0.30,
            extra_mats[idx % 3],
            location=(bx, by, bz),
            rotation=(0.0, 0.0, math.radians(rdeg)),
            depth=0.0012,
        )

    # Cozy night-time warm overhead lamp pool so scale of mess pops against dark corners
    bc.add_light(
        scene,
        "Overhead_Desk_Fill",
        "AREA",
        (-0.15, 0.05, 1.35),
        energy=22.0,
        color=(1.0, 0.62, 0.28),
        target=(0.0, 0.0, 0.0),
        size=1.0,
    )

    # Strict top-down overhead camera zooming OUT from Z=0.56 -> Z=1.78 over 3s (frames 1..72)
    cam_data = bpy.data.cameras.new("Cam_TopDown_Bills")
    cam_data.lens = 35.0
    cam_data.dof.use_dof = False
    cam = bpy.data.objects.new("Cam_TopDown_Bills", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    cam.location = (0.02, -0.05, 0.56)
    cam.rotation_euler = (0.0, 0.0, math.radians(4.0))
    cam.keyframe_insert("location", frame=1)
    cam.keyframe_insert("rotation_euler", frame=1)

    cam.location = (0.0, 0.0, 1.78)
    cam.rotation_euler = (0.0, 0.0, math.radians(-2.0))
    cam.keyframe_insert("location", frame=72)
    cam.keyframe_insert("rotation_euler", frame=72)
    bc.set_interpolation(cam, "BEZIER", "EASE_IN_OUT")

    if render:
        bc.save_and_render_mp4(scene, "Scene_2B_BillsZoom.blend", "Scene_2B_BillsZoom_3s_1920x1080.mp4", fps=24)
    else:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(bc.SCENES_DIR, "Scene_2B_BillsZoom.blend"))


if __name__ == "__main__":
    build_scene_2b(render=True)
