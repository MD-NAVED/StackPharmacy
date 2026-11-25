"""SCENE 4 — LOGO STING (8s = 192 frames @ 24fps): Clean white-to-teal gradient background,
StackPharmacy logo PNG with emission scaling in with spring overshoot, blooming soft teal glow,
and subtle radial particle burst settling cleanly for a rock-solid 1.5s+ end hold.
Exports BOTH 1920x1080 (16:9) and 1080x1920 (9:16) versions.
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


def build_white_to_teal_backdrop(scene):
    """Build a crisp luminous white-to-teal linear gradient studio backdrop."""
    # Set Standard view transform so clean brand whites remain true crisp white without murky compression
    try:
        scene.view_settings.view_transform = "Standard"
        scene.view_settings.look = "None"
    except Exception:
        pass

    world = bpy.data.worlds.new("StingWorld")
    scene.world = world
    wn = world.node_tree.nodes
    wl = world.node_tree.links
    wn.clear()
    bg = wn.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.85, 0.96, 0.95, 1.0)
    bg.inputs["Strength"].default_value = 1.0
    wout = wn.new("ShaderNodeOutputWorld")
    wl.new(bg.outputs["Background"], wout.inputs["Surface"])

    # Clean vertical/diagonal white-to-teal emissive background plane behind logo & glow
    bg_mat = bpy.data.materials.new("White_To_Teal_Grad")
    nodes = bg_mat.node_tree.nodes
    links = bg_mat.node_tree.links
    nodes.clear()

    tc = nodes.new("ShaderNodeTexCoord")
    sep = nodes.new("ShaderNodeSeparateXYZ")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.02
    # Bottom rich clean teal -> mid soft mint -> top crisp clean white
    ramp.color_ramp.elements[0].color = (0.04, 0.50, 0.45, 1.0)
    mid = ramp.color_ramp.elements.new(0.42)
    mid.color = (0.74, 0.94, 0.91, 1.0)
    ramp.color_ramp.elements[-1].position = 0.86
    ramp.color_ramp.elements[-1].color = (0.985, 0.996, 0.994, 1.0)

    em = nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.0
    out = nodes.new("ShaderNodeOutputMaterial")

    links.new(tc.outputs["Window"], sep.inputs["Vector"])
    links.new(sep.outputs["Y"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], em.inputs["Color"])
    links.new(em.outputs["Emission"], out.inputs["Surface"])

    bpy.ops.mesh.primitive_plane_add(size=12.0, location=(0.0, 1.8, 0.0))
    bg_plane = bpy.context.active_object
    bg_plane.name = "White_Teal_Gradient_Plane"
    bg_plane.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    bg_plane.data.materials.append(bg_mat)
    return bg_plane


def build_soft_teal_bloom_disc(scene, radius: float = 1.45):
    """Create a procedural radial glowing teal aura disc behind the logo."""
    mat = bpy.data.materials.new("Soft_Teal_Halo")
    mat.surface_render_method = "BLENDED"
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    tc = nodes.new("ShaderNodeTexCoord")
    grad = nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "QUADRATIC_SPHERE"
    mp = nodes.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (0.0, 0.0, 0.0)
    mp.inputs["Scale"].default_value = (1.0 / radius, 1.0 / radius, 1.0)

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    ramp.color_ramp.elements[1].position = 0.95
    ramp.color_ramp.elements[1].color = (0.85, 0.85, 0.85, 1.0)

    mul_alpha = nodes.new("ShaderNodeMath")
    mul_alpha.operation = "MULTIPLY"
    mul_alpha.inputs[1].default_value = 0.55

    em = nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (0.05, 0.95, 0.82, 1.0)
    em.inputs["Strength"].default_value = 2.2
    transp = nodes.new("ShaderNodeBsdfTransparent")
    mix_sh = nodes.new("ShaderNodeMixShader")
    out = nodes.new("ShaderNodeOutputMaterial")

    links.new(tc.outputs["Object"], mp.inputs["Vector"])
    links.new(mp.outputs["Vector"], grad.inputs["Vector"])
    links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], mul_alpha.inputs[0])
    links.new(mul_alpha.outputs["Value"], mix_sh.inputs["Fac"])
    links.new(transp.outputs["BSDF"], mix_sh.inputs[1])
    links.new(em.outputs["Emission"], mix_sh.inputs[2])
    links.new(mix_sh.outputs["Shader"], out.inputs["Surface"])

    bpy.ops.mesh.primitive_plane_add(size=radius * 2.0, location=(0.0, 0.25, 0.0))
    disc = bpy.context.active_object
    disc.name = "Soft_Teal_Glow_Halo"
    disc.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    disc.data.materials.append(mat)
    return disc, mul_alpha, em


def create_logo_sting_scene(is_vertical: bool = False, render: bool = True):
    res_x, res_y = (1080, 1920) if is_vertical else (1920, 1080)
    tag = "9x16" if is_vertical else "16x9"
    # 8.0s = 192 frames @ 24fps
    scene = bc.reset_scene(fps=24, frame_start=1, frame_end=192, res_x=res_x, res_y=res_y, samples=18)
    bc.setup_compositor(scene, glare_strength=0.68, glare_threshold=0.92, glare_size=0.72, grain_strength=0.0, frame_end=192)

    build_white_to_teal_backdrop(scene)
    glow_disc, halo_alpha_math, halo_em = build_soft_teal_bloom_disc(scene, radius=1.55 if is_vertical else 1.85)

    # Logo Plane with PNG + subtle luminous emission
    logo_img = "logo_stackpharmacy_vertical.png" if is_vertical else "logo_stackpharmacy.png"
    logo_mat = bc.make_image_mat(
        f"Logo_Sting_Mat_{tag}",
        logo_img,
        roughness=0.25,
        emission_strength=1.08,
        use_alpha=True,
    )
    plane_w = 1.48 if is_vertical else 2.25
    plane_h = plane_w * (1200.0 / 1400.0 if is_vertical else 768.0 / 2048.0)

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, 0.0, 0.0))
    logo = bpy.context.active_object
    logo.name = "StackPharmacy_Logo_Plane"
    logo.scale = (plane_w, plane_h, 1.0)
    bc.apply_scale(logo)
    logo.location = (0.0, 0.0, 0.04)
    logo.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    logo.data.materials.append(logo_mat)

    # Camera centered strictly forward
    cam = bc.create_camera(scene, "Cam_Logo_Sting", (0.0, -3.1 if is_vertical else -2.8, 0.0), (0.0, 0.0, 0.0), lens_mm=50.0, use_dof=False)
    # Very gentle cinematic settle pull-in during active entrance (frames 1..144), rock-steady hold 145..192 (>1.5s hold!)
    cam.location = (0.0, -3.35 if is_vertical else -3.05, 0.0)
    cam.keyframe_insert("location", frame=1)
    cam.location = (0.0, -3.05 if is_vertical else -2.75, 0.0)
    cam.keyframe_insert("location", frame=144)
    cam.location = (0.0, -3.05 if is_vertical else -2.75, 0.0)
    cam.keyframe_insert("location", frame=192)
    bc.set_interpolation(cam, "BEZIER", "EASE_IN_OUT")

    # Scale-In with slight overshoot (frames 14..56), plus gentle ambient breathing until frame 144, then 2.0s crisp hold (144..192 = 48 frames > 1.5s!)
    scale_keys = [
        (1, 0.001),
        (14, 0.001),
        (30, 1.115),   # crisp overshoot pop
        (42, 0.968),   # rebound settle
        (54, 1.005),
        (68, 1.000),
        (192, 1.000),  # holds rock steady through 8.0s end (well over 1.5s required hold!)
    ]
    for f, sc in scale_keys:
        logo.scale = (sc, sc, sc)
        logo.keyframe_insert("scale", frame=f)
    bc.set_interpolation(logo, "BEZIER", "EASE_IN_OUT")

    # Soft teal glow blooms behind the logo at frame 24 -> peaks frame 46 -> holds warm ambient
    halo_keys = [
        (1, 0.001, 0.0, 0.0),
        (16, 0.15, 0.0, 0.0),
        (44, 1.25, 0.65, 2.8),
        (72, 1.05, 0.45, 1.9),
        (144, 1.05, 0.45, 1.9),
        (192, 1.05, 0.45, 1.9),
    ]
    for f, sc, al, em_s in halo_keys:
        glow_disc.scale = (sc, sc, sc)
        glow_disc.keyframe_insert("scale", frame=f)
        halo_alpha_math.inputs[1].default_value = al
        halo_alpha_math.inputs[1].keyframe_insert("default_value", frame=f)
        halo_em.inputs["Strength"].default_value = em_s
        halo_em.inputs["Strength"].keyframe_insert("default_value", frame=f)
    bc.set_interpolation(glow_disc, "BEZIER", "EASE_IN_OUT")

    # Subtle Particle Burst synced to logo pop (spawns f=26, expands outward & dissolves cleanly before f=144 end hold!)
    p_mats = [
        bc.make_pbr_mat("Sting_Part_Teal", (0.02, 0.72, 0.64), emission_color=(0.05, 0.92, 0.80), emission_strength=2.2),
        bc.make_pbr_mat("Sting_Part_Mint", (0.72, 0.98, 0.92), emission_color=(0.82, 1.0, 0.96), emission_strength=2.4),
    ]
    rng = random.Random(404)
    n_particles = 44
    for i in range(n_particles):
        ang = (2.0 * math.pi * i / n_particles) + rng.uniform(-0.14, 0.14)
        rad_min = 0.25
        rad_max = rng.uniform(0.75, 1.35 if is_vertical else 1.65)
        start_pos = (math.cos(ang) * rad_min * 0.4, 0.12, math.sin(ang) * rad_min * 0.25)
        end_pos = (math.cos(ang) * rad_max, rng.uniform(0.05, 0.25), math.sin(ang) * rad_max * (0.85 if is_vertical else 0.55) + 0.04)
        p_sz = rng.uniform(0.008, 0.020)

        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=p_sz, location=start_pos)
        pt = bpy.context.active_object
        pt.name = f"BurstParticle_{i:02d}"
        pt.data.materials.append(p_mats[i % 2])

        f_start = 26 + (i % 6)
        f_end = f_start + rng.randint(58, 86)  # all vanish cleanly before f=140 so final 2.0s hold is pristine!

        pt.location = start_pos
        pt.scale = (0.001, 0.001, 0.001)
        pt.keyframe_insert("location", frame=1)
        pt.keyframe_insert("scale", frame=1)
        pt.keyframe_insert("location", frame=f_start)
        pt.keyframe_insert("scale", frame=f_start)

        pt.location = (
            start_pos[0] + (end_pos[0] - start_pos[0]) * 0.68,
            end_pos[1],
            start_pos[2] + (end_pos[2] - start_pos[2]) * 0.68,
        )
        pt.scale = (1.15, 1.15, 1.15)
        pt.keyframe_insert("location", frame=f_start + 14)
        pt.keyframe_insert("scale", frame=f_start + 14)

        pt.location = end_pos
        pt.scale = (0.001, 0.001, 0.001)
        pt.keyframe_insert("location", frame=f_end)
        pt.keyframe_insert("scale", frame=f_end)
        pt.keyframe_insert("scale", frame=192)
        bc.set_interpolation(pt, "BEZIER", "EASE_OUT")

    blend_name = f"Scene_4_LogoSting_{tag}.blend"
    mp4_name = f"Scene_4_LogoSting_8s_{res_x}x{res_y}.mp4"
    if render:
        bc.save_and_render_mp4(scene, blend_name, mp4_name, fps=24)
    else:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(bc.SCENES_DIR, blend_name))


def build_scene_4_both(render: bool = True):
    create_logo_sting_scene(is_vertical=False, render=render)
    create_logo_sting_scene(is_vertical=True, render=render)


if __name__ == "__main__":
    build_scene_4_both(render=True)
