"""SCENE 2 — PROBLEM (counter): Low-poly chemist counter at night under warm lamp light,
messy stack of paper invoices, retro calculator, scattered blister packs/strips.
Slow lateral L->R camera drift + cinematic rack focus from foreground pile to background shelves.
"""

import math
import os
import random
import sys
import bpy

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)

import blender_common as bc


def build_counter_environment(scene):
    """Shared low-poly night chemist counter, background shelves, lamp, mess, calculator, and strips."""
    counter_top = bc.make_pbr_mat("Counter_Laminate", (0.16, 0.13, 0.10), roughness=0.46)
    wall_mat = bc.make_pbr_mat("Night_Wall", (0.015, 0.022, 0.028), roughness=0.88)
    wood_shelf = bc.make_pbr_mat("Bg_Shelf_Wood", (0.055, 0.048, 0.044), roughness=0.65)
    metal_mat = bc.make_pbr_mat("Lamp_Metal", (0.05, 0.06, 0.06), roughness=0.35, metallic=0.88)
    foil_mat = bc.make_pbr_mat("Blister_Foil", (0.76, 0.78, 0.80), roughness=0.26, metallic=0.90)
    pill_mat = bc.make_pbr_mat("Blister_Pill", (0.85, 0.90, 0.92), roughness=0.32, alpha=0.85)

    # Countertop (Z=0 top face)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    desk = bpy.context.active_object
    desk.name = "Chemist_Counter"
    desk.scale = (2.8, 1.55, 0.08)
    bc.apply_scale(desk)
    desk.location = (0.0, 0.0, -0.04)
    desk.data.materials.append(counter_top)

    # Rear pharmacy shelves (Z ~ 0.15..1.5, Y = 1.65) for background depth & rack focus target
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    rw = bpy.context.active_object
    rw.scale = (6.0, 0.1, 3.0)
    bc.apply_scale(rw)
    rw.location = (0.0, 1.95, 0.8)
    rw.data.materials.append(wall_mat)

    for z_sh in (0.35, 0.78, 1.22):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
        sh = bpy.context.active_object
        sh.scale = (4.2, 0.36, 0.035)
        bc.apply_scale(sh)
        sh.location = (0.0, 1.62, z_sh)
        sh.data.materials.append(wood_shelf)

        for bx in (-1.35, -0.88, -0.35, 0.15, 0.62, 1.12):
            tex = f"shelf_box_0{((abs(int(bx * 10)) + int(z_sh * 10)) % 5) + 1}.png"
            bc.create_medicine_box(scene, f"BgBox_{z_sh}_{bx}", (0.24, 0.12, 0.18), (bx, 1.58, z_sh + 0.108), ((bx * 17) % 9) - 4, tex, (0.10, 0.12, 0.12))

    # Practical Desk Lamp (top-left of counter) with smooth cone
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=0.095, depth=0.025, location=(-0.68, 0.28, 0.0125))
    bpy.context.active_object.data.materials.append(metal_mat)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.012, depth=0.48, location=(-0.64, 0.25, 0.25))
    arm = bpy.context.active_object
    arm.rotation_euler = (math.radians(14), math.radians(18), 0)
    arm.data.materials.append(metal_mat)
    bpy.ops.mesh.primitive_cone_add(vertices=36, radius1=0.11, radius2=0.04, depth=0.14, location=(-0.48, 0.14, 0.45))
    hood = bpy.context.active_object
    hood.rotation_euler = (math.radians(-22), math.radians(-28), 0)
    hood.data.materials.append(metal_mat)
    bpy.ops.object.shade_smooth()

    # Warm incandescent night lamp light + soft moonlight on rear store shelves
    bc.add_light(
        scene,
        "Warm_Desk_Lamp",
        "SPOT",
        (-0.44, 0.10, 0.48),
        energy=215.0,
        color=(1.0, 0.58, 0.24),
        target=(0.04, -0.04, 0.0),
        size=0.16,
        spot_deg=74.0,
        spot_blend=0.68,
    )
    bc.add_light(
        scene,
        "Night_Bg_Cool_Fill",
        "AREA",
        (-0.8, 0.85, 1.45),
        energy=42.0,
        color=(0.38, 0.56, 0.78),
        target=(0.15, 1.55, 0.75),
        size=1.8,
    )

    # Calculator clearly visible beside front-right of invoice pile
    calc_mat = bc.make_image_mat("Calculator_Mat", "calculator_face.png", roughness=0.40)
    calc_body = bc.make_pbr_mat("Calculator_Body", (0.14, 0.16, 0.18), roughness=0.45)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    calc = bpy.context.active_object
    calc.name = "Chemist_Calculator"
    calc.scale = (0.145, 0.205, 0.024)
    bc.apply_scale(calc)
    calc.data.materials.append(calc_body)
    calc.data.materials.append(calc_mat)
    uv = calc.data.uv_layers.active or calc.data.uv_layers.new()
    for poly in calc.data.polygons:
        if poly.normal.z > 0.7:
            poly.material_index = 1
            for li in poly.loop_indices:
                co = calc.data.vertices[calc.data.loops[li].vertex_index].co
                uv.data[li].uv = (co.x / 0.145 + 0.5, co.y / 0.205 + 0.5)
        else:
            poly.material_index = 0
    calc.location = (0.40, -0.24, 0.016)
    calc.rotation_euler = (math.radians(3.0), 0.0, math.radians(-16.0))

    # Messy stack of 14 crooked distributor bills overlapping across center desk (keeping calculator clean)
    bill_mats = [
        bc.make_image_mat(f"Bill_Paper_{i}", f"distributor_bill_{(i % 3) + 1}.png", roughness=0.82)
        for i in range(3)
    ]
    rng = random.Random(202)
    for k in range(14):
        layer_z = 0.002 + k * 0.0024
        if k < 8:
            # Central dense messy pile
            bx = rng.uniform(-0.20, 0.12)
            by = rng.uniform(-0.20, 0.12)
        else:
            # Overflow bills spilled outward across counter (away from calculator spot)
            bx = rng.uniform(-0.46, 0.26) if k % 2 == 0 else rng.uniform(-0.25, 0.30)
            by = rng.uniform(0.05, 0.30) if bx > 0.16 else rng.uniform(-0.34, 0.28)
        rz = rng.uniform(-34.0, 34.0)
        bc.create_beveled_plane(
            scene,
            f"Invoice_Sheet_{k:02d}",
            0.22,
            0.30,
            bill_mats[k % 3],
            location=(bx, by, layer_z),
            rotation=(math.radians(rng.uniform(-1.5, 1.5)), math.radians(rng.uniform(-1.5, 1.5)), math.radians(rz)),
            depth=0.0012,
        )

    # Scattered blister strips on desk
    strip_spots = [
        (-0.29, -0.26, 0.004, 24.0),
        (-0.24, -0.31, 0.009, -12.0),
        (0.18, -0.34, 0.004, 42.0),
        (-0.42, 0.02, 0.004, 68.0),
        (0.46, 0.06, 0.004, -35.0),
    ]
    for idx, (sx, sy, sz, srot) in enumerate(strip_spots):
        bc.create_blister_strip(scene, f"Blister_Strip_{idx}", (sx, sy, sz), srot, foil_mat, pill_mat)


def build_scene_2(render: bool = True):
    scene = bc.reset_scene(fps=24, frame_start=1, frame_end=72, res_x=1920, res_y=1080, samples=18)
    bc.set_dark_world(scene, color=(0.010, 0.015, 0.022), strength=0.20)
    bc.setup_compositor(scene, glare_strength=0.45, glare_threshold=0.95, glare_size=0.60, grain_strength=0.025, frame_end=72)

    build_counter_environment(scene)

    # Slow lateral L->R camera drift + Rack Focus from invoice pile -> background shelves
    cam = bc.create_camera(scene, "Cam_Problem_Counter", (-0.42, -1.18, 0.34), (0.04, 0.12, 0.12), lens_mm=42.0, fstop=1.8, use_dof=True)
    cam.data.dof.focus_distance = 1.15
    cam.data.dof.keyframe_insert("focus_distance", frame=1)
    cam.data.dof.focus_distance = 1.15
    cam.data.dof.keyframe_insert("focus_distance", frame=24)
    cam.data.dof.focus_distance = 2.85
    cam.data.dof.keyframe_insert("focus_distance", frame=54)
    cam.data.dof.focus_distance = 2.95
    cam.data.dof.keyframe_insert("focus_distance", frame=72)
    bc.set_interpolation(cam.data.dof, "BEZIER", "EASE_IN_OUT")

    cam.location = (-0.44, -1.18, 0.33)
    bc.aim_object_at(cam, (0.02, 0.18, 0.14))
    cam.keyframe_insert("location", frame=1)
    cam.keyframe_insert("rotation_euler", frame=1)

    cam.location = (0.36, -1.15, 0.33)
    bc.aim_object_at(cam, (0.06, 0.24, 0.16))
    cam.keyframe_insert("location", frame=72)
    cam.keyframe_insert("rotation_euler", frame=72)
    bc.set_interpolation(cam, "BEZIER", "EASE_IN_OUT")

    if render:
        bc.save_and_render_mp4(scene, "Scene_2_Counter.blend", "Scene_2_Counter_3s_1920x1080.mp4", fps=24)
    else:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(bc.SCENES_DIR, "Scene_2_Counter.blend"))


if __name__ == "__main__":
    build_scene_2(render=True)
