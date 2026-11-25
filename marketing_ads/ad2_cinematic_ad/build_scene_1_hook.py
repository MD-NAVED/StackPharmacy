"""SCENE 1 — HOOK (shelf): Dark cinematic pharmacy shelf, 6 low-poly muted medicine boxes,
right foreground hero box pulsing soft red emission (2s cycle), dusty top-right light beam,
slow 3s camera push-in with shallow DOF and subtle film grain in compositing.
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


def build_scene_1(render: bool = True):
    scene = bc.reset_scene(fps=24, frame_start=1, frame_end=72, res_x=1920, res_y=1080, samples=18)
    bc.set_dark_world(scene, color=(0.008, 0.012, 0.016), strength=0.18)
    bc.setup_compositor(scene, glare_strength=0.85, glare_threshold=0.72, glare_size=0.72, grain_strength=0.036, frame_end=72)

    # Shelf structure (main hero shelf Z=0, upper shelf Z=0.68, dark store wall behind)
    wood_dark = bc.make_pbr_mat("Shelf_Wood_Dark", (0.045, 0.042, 0.040), roughness=0.58)
    metal_dark = bc.make_pbr_mat("Shelf_Metal", (0.025, 0.030, 0.034), roughness=0.40, metallic=0.85)
    back_wall = bc.make_pbr_mat("Shelf_Back_Wall", (0.014, 0.018, 0.022), roughness=0.92)

    for z_pos, thick in [(0.0, 0.042), (0.68, 0.042), (-0.52, 0.042)]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
        s = bpy.context.active_object
        s.scale = (3.4, 0.72, thick)
        bc.apply_scale(s)
        s.location = (0.0, 0.0, z_pos - thick * 0.5)
        s.data.materials.append(wood_dark)

    for x_upright in (-1.55, 1.55):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
        u = bpy.context.active_object
        u.scale = (0.06, 0.74, 1.80)
        bc.apply_scale(u)
        u.location = (x_upright, 0.0, 0.10)
        u.data.materials.append(metal_dark)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    bw = bpy.context.active_object
    bw.scale = (3.4, 0.04, 2.2)
    bc.apply_scale(bw)
    bw.location = (0.0, 0.36, 0.12)
    bw.data.materials.append(back_wall)

    # 5 Muted foreground shelf boxes (desaturated clinical tones)
    muted_specs = [
        ("Box_Muted_1", (0.28, 0.14, 0.21), (-1.12, 0.06, 0.105), 4.0, "shelf_box_01.png", (0.11, 0.12, 0.13)),
        ("Box_Muted_2", (0.26, 0.13, 0.25), (-0.74, 0.02, 0.125), -3.0, "shelf_box_02.png", (0.13, 0.12, 0.11)),
        ("Box_Muted_3", (0.30, 0.14, 0.19), (-0.34, 0.07, 0.095), 2.5, "shelf_box_03.png", (0.10, 0.12, 0.12)),
        ("Box_Muted_4", (0.25, 0.13, 0.23), (0.04, 0.04, 0.115), -4.5, "shelf_box_04.png", (0.12, 0.11, 0.12)),
        ("Box_Muted_5", (0.24, 0.12, 0.20), (1.02, 0.08, 0.100), 6.0, "shelf_box_05.png", (0.11, 0.12, 0.11)),
        # Upper shelf blurred silhouette boxes for cinematic depth
        ("Box_Upper_1", (0.28, 0.14, 0.22), (-0.42, 0.04, 0.790), 2.0, "shelf_box_02.png", (0.09, 0.09, 0.10)),
        ("Box_Upper_2", (0.28, 0.14, 0.22), (0.34, 0.06, 0.790), -3.0, "shelf_box_01.png", (0.09, 0.10, 0.10)),
    ]
    for bname, dims, loc, rdeg, tex, bcol in muted_specs:
        bc.create_medicine_box(scene, bname, dims, loc, rdeg, tex, body_color=bcol)

    # Hero Box on right side, slightly forward (pulses with soft red emission glow on 2s cycle = 48f)
    hero_x, hero_y, hero_z = 0.48, -0.15, 0.122
    hero_box = bc.create_medicine_box(
        scene,
        "Hero_Expiry_Box",
        (0.32, 0.15, 0.244),
        (hero_x, hero_y, hero_z),
        -11.0,
        "shelf_box_expiry_hero.png",
        body_color=(0.14, 0.06, 0.06),
    )

    # Upgrade Hero label shader to pulse crimson red emission over 2.0s cycle (frames 1..72)
    hero_mat = hero_box.data.materials[1]
    nodes = hero_mat.node_tree.nodes
    links = hero_mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    tex_node = next(n for n in nodes if n.type == "TEX_IMAGE")

    # Isolate reddish tones on hero label to amplify warning strip emission while keeping print razor sharp
    sep = nodes.new("ShaderNodeSeparateColor")
    sub = nodes.new("ShaderNodeMath")
    sub.operation = "SUBTRACT"
    ramp = nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = 0.22
    ramp.inputs["From Max"].default_value = 0.55
    ramp.inputs["To Min"].default_value = 0.0
    ramp.inputs["To Max"].default_value = 1.0
    links.new(tex_node.outputs["Color"], sep.inputs["Color"])
    links.new(sep.outputs["Red"], sub.inputs[0])
    links.new(sep.outputs["Green"], sub.inputs[1])
    links.new(sub.outputs["Value"], ramp.inputs["Value"])

    em_col = nodes.new("ShaderNodeMix")
    em_col.data_type = "RGBA"
    em_col.blend_type = "MIX"
    a_in = [s for s in em_col.inputs if s.name == "A" and s.enabled][0]
    b_in = [s for s in em_col.inputs if s.name == "B" and s.enabled][0]
    res_out = [s for s in em_col.outputs if s.name == "Result" and s.enabled][0]
    a_in.default_value = (0.04, 0.015, 0.015, 1.0)
    b_in.default_value = (1.0, 0.06, 0.04, 1.0)
    links.new(ramp.outputs["Result"], em_col.inputs[0])
    links.new(res_out, bsdf.inputs["Emission Color"])

    # Soft synced crimson point light hugging Hero_Expiry_Box so surrounding wood glows red subtly
    red_glow_light = bc.add_light(
        scene,
        "Hero_Red_Pulse_Light",
        "POINT",
        (hero_x - 0.05, hero_y - 0.14, hero_z + 0.02),
        energy=0.4,
        color=(1.0, 0.12, 0.08),
        size=0.18,
    )

    for f in range(1, 73, 4):
        t = (f - 1) / 24.0
        # 2.0s cycle: low dim at t=0s & t=2s, intense crimson pulse at t=1s & t=3s (close-up climax)
        pulse = 0.5 - 0.5 * math.cos(2.0 * math.pi * t / 2.0)
        bsdf.inputs["Emission Strength"].default_value = 0.15 + 1.75 * pulse
        bsdf.inputs["Emission Strength"].keyframe_insert("default_value", frame=f)
        red_glow_light.data.energy = 0.2 + 3.4 * pulse
        red_glow_light.data.keyframe_insert("energy", frame=f)

    # Top-right cinematic dusty spotlight + volumetric scatter cube for visible light shaft
    bc.add_light(
        scene,
        "TopRight_Cinema_Spot",
        "SPOT",
        (2.15, -1.35, 2.05),
        energy=260.0,
        color=(0.76, 0.88, 1.0),
        target=(hero_x - 0.14, hero_y, hero_z),
        size=0.18,
        spot_deg=34.0,
        spot_blend=0.72,
    )
    # Subtle soft fill from left edge so muted boxes keep cinematic edge readability
    bc.add_light(
        scene,
        "Shelf_Subtle_Fill",
        "AREA",
        (-2.2, -1.8, 0.7),
        energy=16.0,
        color=(0.45, 0.62, 0.75),
        target=(-0.3, 0.0, 0.15),
        size=1.4,
    )

    # Localized Volumetric Fog Volume covering the shelf area
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    vol_box = bpy.context.active_object
    vol_box.name = "Volumetric_Beam_Box"
    vol_box.scale = (3.8, 2.2, 2.2)
    bc.apply_scale(vol_box)
    vol_box.location = (0.2, -0.35, 0.35)
    vol_mat = bpy.data.materials.new("Dust_Beam_Vol")
    vn = vol_mat.node_tree.nodes
    vl = vol_mat.node_tree.links
    vn.clear()
    pv = vn.new("ShaderNodeVolumePrincipled")
    pv.inputs["Color"].default_value = (0.72, 0.85, 0.96, 1.0)
    pv.inputs["Density"].default_value = 0.055
    pv.inputs["Anisotropy"].default_value = 0.62
    vout = vn.new("ShaderNodeOutputMaterial")
    vl.new(pv.outputs["Volume"], vout.inputs["Volume"])
    vol_box.data.materials.append(vol_mat)

    # 85 tiny glowing micro-dust motes drifting inside top-right sunbeam (wispy, not polka-dot)
    dust_mat = bc.make_pbr_mat(
        "Dust_Mote_Mat",
        color=(0.9, 0.96, 1.0),
        emission_color=(0.82, 0.92, 1.0),
        emission_strength=1.35,
        alpha=0.40,
    )
    rng = random.Random(101)
    for i in range(85):
        dx = rng.uniform(-0.15, 1.45)
        dy = rng.uniform(-0.85, 0.12)
        dz = rng.uniform(0.06, 0.95)
        rad = rng.uniform(0.0008, 0.0020)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=rad, location=(dx, dy, dz))
        mote = bpy.context.active_object
        mote.name = f"DustMote_{i:02d}"
        mote.data.materials.append(dust_mat)

        drift_x = rng.uniform(-0.06, 0.04)
        drift_y = rng.uniform(-0.04, 0.04)
        drift_z = rng.uniform(0.03, 0.08)
        mote.location = (dx, dy, dz)
        mote.keyframe_insert("location", frame=1)
        mote.location = (dx + drift_x, dy + drift_y, dz + drift_z)
        mote.keyframe_insert("location", frame=72)
        bc.set_interpolation(mote, "LINEAR")

    # Shallow DOF Camera slow push-in from wide to close on Hero_Expiry_Box over 3s (frames 1..72)
    cam = bc.create_camera(scene, "Cam_Hook_Shelf", (-0.18, -2.55, 0.30), (0.05, 0.0, 0.16), lens_mm=50.0, fstop=1.8, use_dof=True)
    focus_empty = bpy.data.objects.new("Hook_Focus_Target", None)
    scene.collection.objects.link(focus_empty)
    focus_empty.location = (hero_x, hero_y - 0.08, hero_z)
    cam.data.dof.focus_object = focus_empty

    cam.location = (-0.22, -2.65, 0.32)
    bc.aim_object_at(cam, (0.02, 0.0, 0.16))
    cam.keyframe_insert("location", frame=1)
    cam.keyframe_insert("rotation_euler", frame=1)

    cam.location = (hero_x - 0.16, hero_y - 1.16, hero_z + 0.07)
    bc.aim_object_at(cam, (hero_x - 0.03, hero_y, hero_z))
    cam.keyframe_insert("location", frame=72)
    cam.keyframe_insert("rotation_euler", frame=72)
    bc.set_interpolation(cam, "BEZIER", "EASE_IN_OUT")

    if render:
        bc.save_and_render_mp4(scene, "Scene_1_Hook.blend", "Scene_1_Hook_3s_1920x1080.mp4", fps=24)
    else:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(bc.SCENES_DIR, "Scene_1_Hook.blend"))


if __name__ == "__main__":
    build_scene_1(render=True)
