"""SCENE 3B — NOTIFICATIONS: Macro close-up of phone screen area showing a
clean blank frosted glass notification card (ready for CapCut text overlay)
with a subtle glowing teal border sliding in with smooth spring ease over 3s.
"""

import math
import os
import sys
import bpy

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)

import blender_common as bc
from build_scene_3_phone import build_smartphone_rig, build_teal_studio_stage


def build_blank_notification_card(scene, parent_rig):
    """Build a blank dark frosted glass notification card with glowing border rim."""
    card_root = bpy.data.objects.new("Notification_Card_Root", None)
    scene.collection.objects.link(card_root)
    card_root.parent = parent_rig

    cw, ch, cd = 0.205, 0.064, 0.0038

    # Inner dark frosted blank surface (clean space for CapCut headline/subtext)
    body_mat = bc.make_pbr_mat(
        "Notif_Frosted_Blank",
        color=(0.008, 0.024, 0.024),
        roughness=0.18,
        metallic=0.12,
        emission_color=(0.008, 0.032, 0.030),
        emission_strength=0.18,
        alpha=0.92,
    )
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    card_body = bpy.context.active_object
    card_body.name = "Notif_Blank_Surface"
    card_body.scale = (cw, cd, ch)
    bc.apply_scale(card_body)
    bev = card_body.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.0055
    bev.segments = 4
    bpy.ops.object.modifier_apply(modifier="Bevel")
    card_body.data.materials.append(body_mat)
    card_body.parent = card_root

    # Outer glowing teal-mint border rim framing the card cleanly
    rim_mat = bc.make_pbr_mat(
        "Notif_Glow_Border",
        color=(0.18, 0.96, 0.78),
        roughness=0.15,
        emission_color=(0.14, 0.98, 0.80),
        emission_strength=1.9,
    )
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    rim = bpy.context.active_object
    rim.name = "Notif_Glow_Rim"
    rim.scale = (cw + 0.0045, cd * 0.78, ch + 0.0045)
    bc.apply_scale(rim)
    rim.location = (0.0, 0.0008, 0.0)
    bev2 = rim.modifiers.new("Bevel", "BEVEL")
    bev2.width = 0.0065
    bev2.segments = 4
    bpy.ops.object.modifier_apply(modifier="Bevel")
    rim.data.materials.append(rim_mat)
    rim.parent = card_root

    # Subtle status dot pill on far-left margin (leaves ~88% width 100% blank for CapCut text)
    dot_mat = bc.make_pbr_mat(
        "Notif_Accent_Pill",
        color=(0.20, 1.0, 0.80),
        emission_color=(0.15, 1.0, 0.82),
        emission_strength=2.2,
    )
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    accent = bpy.context.active_object
    accent.name = "Notif_Left_Accent_Bar"
    accent.scale = (0.0042, 0.0012, ch * 0.54)
    bc.apply_scale(accent)
    accent.location = (-cw * 0.43, -cd * 0.55, 0.0)
    accent.data.materials.append(dot_mat)
    accent.parent = card_root

    return card_root, rim_mat


def build_scene_3b(render: bool = True):
    scene = bc.reset_scene(fps=24, frame_start=1, frame_end=72, res_x=1920, res_y=1080, samples=20, use_raytracing=True)
    bc.setup_compositor(scene, glare_strength=0.40, glare_threshold=1.05, glare_size=0.58, grain_strength=0.0, frame_end=72)

    build_teal_studio_stage(scene)
    rig = build_smartphone_rig(scene, tilt_deg=15.0)
    card_root, rim_mat = build_blank_notification_card(scene, rig)

    # Studio lighting focused on angled screen glass + card bevel
    bc.add_light(
        scene,
        "Macro_Key_Light",
        "AREA",
        (-0.68, -0.95, 0.78),
        energy=30.0,
        color=(0.94, 0.99, 1.0),
        target=(0.0, 0.0, 0.36),
        size=0.95,
    )
    bc.add_light(
        scene,
        "Macro_Teal_Rim",
        "AREA",
        (0.42, 0.55, 0.65),
        energy=95.0,
        color=(0.04, 0.96, 0.82),
        target=(0.0, 0.0, 0.36),
        size=0.7,
    )

    # Spring-eased slide-in animation over frames 8..34, holding steadily through frame 72
    # Local rig coords: screen sits at Y ~ -0.0087, card hovers out at Y = -0.024, upper-mid Z = 0.075
    rest_x, rest_y, rest_z = 0.0, -0.024, 0.072
    start_x = 0.34

    card_root.location = (start_x, rest_y - 0.015, rest_z + 0.02)
    card_root.scale = (0.86, 0.86, 0.86)
    card_root.keyframe_insert("location", frame=1)
    card_root.keyframe_insert("scale", frame=1)
    card_root.keyframe_insert("location", frame=8)
    card_root.keyframe_insert("scale", frame=8)

    # Evaluate underdamped spring curve over frames 8..34 for snappy overshoot & settle
    n_spring = 26
    for step in range(1, n_spring + 1):
        f = 8 + step
        u = step / float(n_spring)
        # Damped spring displacement s(u): 0 -> ~1.07 -> 0.985 -> 1.0
        sp = 1.0 - math.exp(-5.8 * u) * math.cos(2.6 * math.pi * u)
        cur_x = start_x + (rest_x - start_x) * sp
        cur_z = (rest_z + 0.02) * (1.0 - sp) + rest_z * sp
        sc = 0.86 + 0.14 * sp
        card_root.location = (cur_x, rest_y, cur_z)
        card_root.scale = (sc, 1.0, sc)
        card_root.keyframe_insert("location", frame=f)
        card_root.keyframe_insert("scale", frame=f)

    card_root.location = (rest_x, rest_y, rest_z)
    card_root.scale = (1.0, 1.0, 1.0)
    card_root.keyframe_insert("location", frame=72)
    card_root.keyframe_insert("scale", frame=72)

    # Subtle glowing border breath pulse after card lands
    bsdf_rim = next(n for n in rim_mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    for f, val in [(1, 1.8), (18, 3.6), (34, 2.4), (54, 3.1), (72, 2.5)]:
        bsdf_rim.inputs["Emission Strength"].default_value = val
        bsdf_rim.inputs["Emission Strength"].keyframe_insert("default_value", frame=f)

    # Close-up macro camera angled onto the upper-mid phone screen area
    focus_target = bpy.data.objects.new("Notif_Focus_Target", None)
    scene.collection.objects.link(focus_target)
    focus_target.parent = rig
    focus_target.location = (0.0, -0.020, 0.070)

    cam = bc.create_camera(
        scene,
        "Cam_Notif_Closeup",
        (-0.22, -0.44, 0.44),
        (0.0, -0.02, 0.40),
        lens_mm=60.0,
        fstop=2.4,
        use_dof=True,
    )
    cam.data.dof.focus_object = focus_target

    # Subtle creamy macro push-in over 3s
    cam.location = (-0.23, -0.45, 0.445)
    bc.aim_object_at(cam, (0.0, -0.02, 0.395))
    cam.keyframe_insert("location", frame=1)
    cam.keyframe_insert("rotation_euler", frame=1)

    cam.location = (-0.16, -0.39, 0.425)
    bc.aim_object_at(cam, (0.0, -0.02, 0.405))
    cam.keyframe_insert("location", frame=72)
    cam.keyframe_insert("rotation_euler", frame=72)
    bc.set_interpolation(cam, "BEZIER", "EASE_IN_OUT")

    if render:
        bc.save_and_render_mp4(scene, "Scene_3B_Notification.blend", "Scene_3B_Notification_3s_1920x1080.mp4", fps=24)
    else:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(bc.SCENES_DIR, "Scene_3B_Notification.blend"))


if __name__ == "__main__":
    build_scene_3b(render=True)
