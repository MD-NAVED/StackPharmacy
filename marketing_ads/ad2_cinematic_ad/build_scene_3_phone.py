"""SCENE 3 — PHONE REVEAL: Modern smartphone floating at 15 deg tilt over a dark
reflective studio floor with teal gradient backdrop. Screen uses dashboard.png
with boosted emission, soft key light, teal rim backlight, 20 deg orbit over 3s.
"""

import math
import os
import sys
import bpy

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)

import blender_common as bc


def build_smartphone_rig(scene, name: str = "Hero_Smartphone_Rig", tilt_deg: float = 15.0):
    """Create a sleek modern smartphone angled by tilt_deg with dashboard.png screen."""
    rig = bpy.data.objects.new(name, None)
    scene.collection.objects.link(rig)

    pw, pd, ph = 0.236, 0.015, 0.492

    # Graphite titanium chassis with clean bevel
    chassis_mat = bc.make_pbr_mat("Phone_Titanium", (0.045, 0.055, 0.062), roughness=0.22, metallic=0.92)
    bezel_mat = bc.make_pbr_mat("Phone_Bezel_Glass", (0.012, 0.015, 0.018), roughness=0.08, metallic=0.1)
    edge_teal = bc.make_pbr_mat("Phone_Teal_Trim", (0.0, 0.48, 0.42), roughness=0.24, metallic=0.85, emission_color=(0.0, 0.75, 0.65), emission_strength=0.18)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    body = bpy.context.active_object
    body.name = "Phone_Body"
    body.scale = (pw, pd, ph)
    bc.apply_scale(body)
    bev = body.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.0045
    bev.segments = 4
    bpy.ops.object.modifier_apply(modifier="Bevel")
    body.data.materials.append(chassis_mat)
    body.parent = rig

    # Subtle glossy dark glass faceplate
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    face = bpy.context.active_object
    face.name = "Phone_Front_Bezel"
    face.scale = (pw * 0.96, 0.002, ph * 0.975)
    bc.apply_scale(face)
    face.location = (0.0, -pd * 0.48, 0.0)
    face.data.materials.append(bezel_mat)
    face.parent = rig

    # Thin metallic accent rail behind screen perimeter
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    trim = bpy.context.active_object
    trim.name = "Phone_Screen_Rim"
    trim.scale = (pw * 0.93, 0.0018, ph * 0.95)
    bc.apply_scale(trim)
    trim.location = (0.0, -pd * 0.495, 0.0)
    trim.data.materials.append(edge_teal)
    trim.parent = rig

    # Dashboard PNG screen plane cleanly in front of rim & bezel (-Y) with boosted emission
    screen_mat = bc.make_image_mat(
        "Dashboard_Screen_Mat",
        "dashboard.png",
        roughness=0.12,
        metallic=0.0,
        emission_strength=1.45,
    )
    sw, sh = pw * 0.905, ph * 0.935
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, 0.0, 0.0))
    scr = bpy.context.active_object
    scr.name = "Phone_Dashboard_Screen"
    scr.scale = (sw, sh, 1.0)
    bc.apply_scale(scr)
    scr.location = (0.0, -pd * 0.50 - 0.0022, 0.0)
    scr.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    scr.data.materials.append(screen_mat)
    scr.parent = rig

    # Sleek top Dynamic Island pill cutout flush on top of screen
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    isl = bpy.context.active_object
    isl.name = "Dynamic_Island"
    isl.scale = (0.044, 0.0014, 0.010)
    bc.apply_scale(isl)
    isl.location = (0.0, -pd * 0.50 - 0.0029, sh * 0.455)
    isl.data.materials.append(bezel_mat)
    isl.parent = rig

    rig.location = (0.0, 0.0, 0.34)
    rig.rotation_euler = (math.radians(-tilt_deg), math.radians(-3.0), 0.0)
    return rig


def build_teal_studio_stage(scene):
    """Dark glossy reflective floor + seamless teal studio gradient backdrop."""
    world = bpy.data.worlds.new("TealStudioWorld")
    scene.world = world
    wn = world.node_tree.nodes
    wl = world.node_tree.links
    wn.clear()

    tc = wn.new("ShaderNodeTexCoord")
    sep = wn.new("ShaderNodeSeparateXYZ")
    ramp = wn.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.08
    ramp.color_ramp.elements[0].color = (0.004, 0.012, 0.014, 1.0)
    ramp.color_ramp.elements[1].position = 0.65
    ramp.color_ramp.elements[1].color = (0.008, 0.042, 0.040, 1.0)
    bg = wn.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 0.85
    wout = wn.new("ShaderNodeOutputWorld")
    wl.new(tc.outputs["Generated"], sep.inputs["Vector"])
    wl.new(sep.outputs["Z"], ramp.inputs["Fac"])
    wl.new(ramp.outputs["Color"], bg.inputs["Color"])
    wl.new(bg.outputs["Background"], wout.inputs["Surface"])

    # Dark reflective studio floor (raytraced reflection enabled in EEVEE)
    floor_mat = bc.make_pbr_mat("Reflective_Studio_Floor", (0.010, 0.014, 0.016), roughness=0.14, metallic=0.28)
    bpy.ops.mesh.primitive_plane_add(size=12.0, location=(0.0, 0.0, 0.0))
    floor = bpy.context.active_object
    floor.name = "Dark_Reflective_Floor"
    floor.data.materials.append(floor_mat)

    # Tall radial-gradient teal studio backdrop cyc behind phone
    cyc_mat = bpy.data.materials.new("Teal_Gradient_Cyc")
    cn = cyc_mat.node_tree.nodes
    cl = cyc_mat.node_tree.links
    bsdf = next(n for n in cn if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = 0.85

    tex_coord = cn.new("ShaderNodeTexCoord")
    grad = cn.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    mp = cn.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (0.0, 0.0, 0.0)
    mp.inputs["Scale"].default_value = (0.55, 0.55, 0.55)
    c_ramp = cn.new("ShaderNodeValToRGB")
    c_ramp.color_ramp.elements[0].position = 0.0
    c_ramp.color_ramp.elements[0].color = (0.004, 0.015, 0.017, 1.0)
    c_ramp.color_ramp.elements[1].position = 1.0
    c_ramp.color_ramp.elements[1].color = (0.00, 0.24, 0.21, 1.0)

    cl.new(tex_coord.outputs["Object"], mp.inputs["Vector"])
    cl.new(mp.outputs["Vector"], grad.inputs["Vector"])
    cl.new(grad.outputs["Fac"], c_ramp.inputs["Fac"])
    cl.new(c_ramp.outputs["Color"], bsdf.inputs["Base Color"])
    cl.new(c_ramp.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 1.35

    bpy.ops.mesh.primitive_plane_add(size=10.0, location=(0.0, 2.2, 1.2))
    cyc = bpy.context.active_object
    cyc.name = "Teal_Gradient_Backdrop"
    cyc.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    cyc.data.materials.append(cyc_mat)


def build_scene_3(render: bool = True):
    scene = bc.reset_scene(fps=24, frame_start=1, frame_end=72, res_x=1920, res_y=1080, samples=20, use_raytracing=True)
    bc.setup_compositor(scene, glare_strength=0.62, glare_threshold=0.90, glare_size=0.65, grain_strength=0.0, frame_end=72)

    build_teal_studio_stage(scene)
    rig = build_smartphone_rig(scene, tilt_deg=15.0)

    # Gentle weightless hover float over 3s
    rig.location = (0.0, 0.0, 0.325)
    rig.keyframe_insert("location", frame=1)
    rig.location = (0.0, 0.0, 0.348)
    rig.keyframe_insert("location", frame=36)
    rig.location = (0.0, 0.0, 0.332)
    rig.keyframe_insert("location", frame=72)
    bc.set_interpolation(rig, "BEZIER", "EASE_IN_OUT")

    # Studio Key Light (soft large area front-left) + Bright Teal Rim Light from behind
    bc.add_light(
        scene,
        "Studio_Soft_Key",
        "AREA",
        (-1.15, -1.35, 0.92),
        energy=42.0,
        color=(0.94, 0.98, 1.0),
        target=(0.0, 0.0, 0.34),
        size=1.35,
    )
    bc.add_light(
        scene,
        "Studio_Fill_Right",
        "AREA",
        (1.25, -0.95, 0.45),
        energy=14.0,
        color=(0.55, 0.85, 0.82),
        target=(0.0, 0.0, 0.34),
        size=1.2,
    )
    bc.add_light(
        scene,
        "Teal_Rim_Backlight",
        "AREA",
        (0.45, 0.82, 0.68),
        energy=110.0,
        color=(0.02, 0.96, 0.82),
        target=(0.0, 0.0, 0.34),
        size=0.85,
    )
    bc.add_light(
        scene,
        "Teal_Rim_Edge_Left",
        "SPOT",
        (-0.78, 0.72, 0.62),
        energy=80.0,
        color=(0.05, 0.92, 0.78),
        target=(0.0, 0.0, 0.34),
        size=0.35,
        spot_deg=48.0,
        spot_blend=0.65,
    )

    # Orbit Camera 20 deg around the hero phone over 3s (frames 1..72) showing dark floor reflection cleanly
    pivot = bpy.data.objects.new("Camera_Orbit_Pivot", None)
    scene.collection.objects.link(pivot)
    pivot.location = (0.0, 0.0, 0.27)

    cam = bc.create_camera(scene, "Cam_Phone_Reveal", (0.0, -1.38, 0.05), (0.0, 0.0, 0.02), lens_mm=48.0, fstop=4.0, use_dof=True)
    cam.data.dof.focus_object = rig
    cam.parent = pivot

    pivot.rotation_euler = (0.0, 0.0, math.radians(-10.0))
    pivot.keyframe_insert("rotation_euler", frame=1)
    pivot.rotation_euler = (0.0, 0.0, math.radians(10.0))
    pivot.keyframe_insert("rotation_euler", frame=72)
    bc.set_interpolation(pivot, "BEZIER", "EASE_IN_OUT")

    if render:
        bc.save_and_render_mp4(scene, "Scene_3_PhoneReveal.blend", "Scene_3_PhoneReveal_3s_1920x1080.mp4", fps=24)
    else:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(bc.SCENES_DIR, "Scene_3_PhoneReveal.blend"))


if __name__ == "__main__":
    build_scene_3(render=True)
