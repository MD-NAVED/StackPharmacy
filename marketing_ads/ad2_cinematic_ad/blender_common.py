"""Shared Blender 5.2 scene, material, compositor, animation, and FFmpeg helpers for Ad #2."""

import math
import os
import shutil
import subprocess
import bpy

AD_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(AD_DIR, "textures")
SCENES_DIR = os.path.join(AD_DIR, "scenes")
OUT_DIR = os.path.join(AD_DIR, "outputs")
os.makedirs(SCENES_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)


def reset_scene(
    fps: int = 24,
    frame_start: int = 1,
    frame_end: int = 72,
    res_x: int = 1920,
    res_y: int = 1080,
    samples: int = 18,
    use_raytracing: bool = False,
):
    """Reset Blender to a clean EEVEE Next scene configured for Ad #2."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = samples
    scene.eevee.use_shadows = True
    scene.eevee.use_raytracing = use_raytracing
    scene.render.fps = fps
    scene.frame_start = frame_start
    scene.frame_end = frame_end
    scene.render.resolution_x = res_x
    scene.render.resolution_y = res_y
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"

    # Cinematic color response without blowing out dark tones
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
    return scene


def setup_compositor(
    scene,
    glare_strength: float = 0.65,
    glare_threshold: float = 0.85,
    glare_size: float = 0.65,
    grain_strength: float = 0.0,
    frame_end: int = 72,
):
    """Build Blender 5.2 compositing node group with Fog Glow + optional 4D film grain."""
    ng = bpy.data.node_groups.new("Ad2Compositor", "CompositorNodeTree")
    ng.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    scene.compositing_node_group = ng

    rl = ng.nodes.new("CompositorNodeRLayers")
    out = ng.nodes.new("NodeGroupOutput")

    glare = ng.nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value = "Fog Glow"
    glare.inputs["Quality"].default_value = "High"
    glare.inputs["Threshold"].default_value = glare_threshold
    glare.inputs["Strength"].default_value = glare_strength
    glare.inputs["Size"].default_value = glare_size
    ng.links.new(rl.outputs["Image"], glare.inputs["Image"])

    prev_sock = glare.outputs["Image"]

    if grain_strength > 0.0:
        ic = ng.nodes.new("CompositorNodeImageCoordinates")
        ng.links.new(rl.outputs["Image"], ic.inputs["Image"])

        wn = ng.nodes.new("ShaderNodeTexWhiteNoise")
        wn.noise_dimensions = "4D"
        ng.links.new(ic.outputs["Pixel"], wn.inputs["Vector"])

        # Animate seed W across frames so sensor grain shimmers naturally per frame
        wn.inputs["W"].default_value = 0.0
        wn.inputs["W"].keyframe_insert("default_value", frame=1)
        wn.inputs["W"].default_value = float(frame_end) * 0.37
        wn.inputs["W"].keyframe_insert("default_value", frame=frame_end)

        mix = ng.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "OVERLAY"
        mix.inputs[0].default_value = grain_strength

        a_in = [s for s in mix.inputs if s.name == "A" and s.enabled][0]
        b_in = [s for s in mix.inputs if s.name == "B" and s.enabled][0]
        res_out = [s for s in mix.outputs if s.name == "Result" and s.enabled][0]

        ng.links.new(prev_sock, a_in)
        ng.links.new(wn.outputs["Value"], b_in)
        prev_sock = res_out

    ng.links.new(prev_sock, out.inputs["Image"])
    return ng


def iter_fcurves(id_block):
    """Yield all fcurves across Blender 5.2 slotted actions or legacy actions."""
    ad = getattr(id_block, "animation_data", None)
    if not ad or not ad.action:
        return
    act = ad.action
    if hasattr(act, "layers") and ad.action_slot:
        for layer in act.layers:
            for strip in layer.strips:
                try:
                    cb = strip.channelbag(ad.action_slot)
                except Exception:
                    cb = None
                if cb:
                    for fc in cb.fcurves:
                        yield fc
    elif hasattr(act, "fcurves"):
        for fc in act.fcurves:
            yield fc


def set_interpolation(id_block, interp: str = "BEZIER", easing: str = "AUTO"):
    """Apply keyframe interpolation/easing safely in Blender 5.2."""
    for fc in iter_fcurves(id_block):
        for kp in fc.keyframe_points:
            kp.interpolation = interp
            if easing != "AUTO":
                kp.easing = easing


def aim_object_at(obj, target_pt):
    """Point an object (Camera/Light) whose local -Z faces forward at target_pt."""
    from mathutils import Vector

    direction = Vector(target_pt) - obj.location
    rot_quat = direction.to_track_quat("-Z", "Y")
    obj.rotation_euler = rot_quat.to_euler()


def set_dark_world(scene, color=(0.015, 0.022, 0.028), strength=0.35):
    """Configure a clean dark ambient world background."""
    world = bpy.data.worlds.new("World")
    scene.world = world
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()
    bg = nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (*color, 1.0)
    bg.inputs["Strength"].default_value = strength
    out = nodes.new("ShaderNodeOutputWorld")
    links.new(bg.outputs["Background"], out.inputs["Surface"])
    return world


def make_pbr_mat(
    name: str,
    color=(0.2, 0.2, 0.2),
    roughness: float = 0.5,
    metallic: float = 0.0,
    emission_color=None,
    emission_strength: float = 0.0,
    alpha: float = 1.0,
):
    """Create a solid Principled BSDF material."""
    mat = bpy.data.materials.new(name)
    nodes = mat.node_tree.nodes
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*color[:3], 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission_color is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission_color[:3], 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = "BLENDED"
    return mat


def make_image_mat(
    name: str,
    img_filename: str,
    roughness: float = 0.45,
    metallic: float = 0.0,
    emission_strength: float = 0.0,
    use_alpha: bool = False,
    tint=(1.0, 1.0, 1.0),
):
    """Create an image-textured PBR material with optional boosted emission and alpha."""
    mat = bpy.data.materials.new(name)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic

    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.join(TEX_DIR, img_filename), check_existing=True)
    tex.extension = "CLIP"

    color_out = tex.outputs["Color"]
    if tint != (1.0, 1.0, 1.0):
        mul = nodes.new("ShaderNodeMix")
        mul.data_type = "RGBA"
        mul.blend_type = "MULTIPLY"
        mul.inputs[0].default_value = 1.0
        a_in = [s for s in mul.inputs if s.name == "A" and s.enabled][0]
        b_in = [s for s in mul.inputs if s.name == "B" and s.enabled][0]
        b_in.default_value = (*tint, 1.0)
        links.new(color_out, a_in)
        color_out = [s for s in mul.outputs if s.name == "Result" and s.enabled][0]

    links.new(color_out, bsdf.inputs["Base Color"])
    if emission_strength > 0.0:
        links.new(color_out, bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = emission_strength

    if use_alpha:
        links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
        mat.surface_render_method = "BLENDED"
    return mat


def create_camera(scene, name: str, location, target, lens_mm: float = 50.0, fstop: float = 2.8, use_dof: bool = False):
    """Create and aim a camera with optional depth of field."""
    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = lens_mm
    cam_data.clip_start = 0.02
    cam_data.clip_end = 100.0
    cam_data.dof.use_dof = use_dof
    cam_data.dof.aperture_fstop = fstop
    cam_obj = bpy.data.objects.new(name, cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = location
    aim_object_at(cam_obj, target)
    scene.camera = cam_obj
    return cam_obj


def add_light(scene, name: str, light_type: str, location, energy: float, color=(1.0, 1.0, 1.0), target=None, size: float = 0.5, spot_deg: float = 45.0, spot_blend: float = 0.5):
    """Create and configure a Blender light source."""
    ldata = bpy.data.lights.new(name, type=light_type)
    ldata.energy = energy
    ldata.color = color[:3]
    if light_type == "AREA":
        ldata.size = size
    elif light_type == "SPOT":
        ldata.spot_size = math.radians(spot_deg)
        ldata.spot_blend = spot_blend
        ldata.shadow_soft_size = size
    elif light_type == "POINT":
        ldata.shadow_soft_size = size
    lobj = bpy.data.objects.new(name, ldata)
    scene.collection.objects.link(lobj)
    lobj.location = location
    if target is not None:
        aim_object_at(lobj, target)
    return lobj


def apply_scale(obj):
    """Apply ONLY scale to obj mesh vertices without altering obj.location or rotation."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)


def create_beveled_plane(scene, name: str, width: float, height: float, mat, location=(0, 0, 0), rotation=(0, 0, 0), depth: float = 0.002):
    """Create a UV-clean card/paper sheet (or thin slab) textured on top/front face."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (width, height, max(0.0008, depth))
    apply_scale(obj)
    obj.data.materials.append(mat)
    # Assign planar UVs matching centered local coordinates cleanly (0..1)
    mesh = obj.data
    uv_layer = mesh.uv_layers.active or mesh.uv_layers.new()
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            v = mesh.vertices[mesh.loops[li].vertex_index].co
            uv_layer.data[li].uv = (v.x / width + 0.5, v.y / height + 0.5)
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def create_medicine_box(scene, name: str, dims, location, rot_z_deg: float, label_img: str, body_color=(0.18, 0.20, 0.22)):
    """Create a low-poly beveled medicine carton with front-facing box label."""
    w, d, h = dims
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    box = bpy.context.active_object
    box.name = name
    box.scale = (w, d, h)
    apply_scale(box)

    bev = box.modifiers.new("Bevel", "BEVEL")
    bev.width = min(w, d, h) * 0.045
    bev.segments = 2
    bpy.ops.object.modifier_apply(modifier="Bevel")

    mat_body = make_pbr_mat(f"{name}_Body", body_color, roughness=0.68)
    mat_front = make_image_mat(f"{name}_Label", label_img, roughness=0.58)
    box.data.materials.append(mat_body)
    box.data.materials.append(mat_front)

    mesh = box.data
    uv_layer = mesh.uv_layers.active or mesh.uv_layers.new()
    for poly in mesh.polygons:
        # Front face (-Y facing camera) receives box label cleanly in 0..1 local space
        if poly.normal.y < -0.7:
            poly.material_index = 1
            for li in poly.loop_indices:
                v = mesh.vertices[mesh.loops[li].vertex_index].co
                uv_layer.data[li].uv = (v.x / w + 0.5, v.z / h + 0.5)
        else:
            poly.material_index = 0

    box.location = location
    box.rotation_euler = (0.0, 0.0, math.radians(rot_z_deg))
    return box


def create_blister_strip(scene, name: str, location, rot_z_deg: float, foil_mat, pill_mat):
    """Create a realistic low-poly metallic blister pack with capsule bubbles."""
    parent = bpy.data.objects.new(name, None)
    scene.collection.objects.link(parent)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    foil = bpy.context.active_object
    foil.name = f"{name}_Foil"
    foil.scale = (0.095, 0.056, 0.0025)
    apply_scale(foil)
    foil.location = (0, 0, 0.0015)
    foil.data.materials.append(foil_mat)
    foil.parent = parent

    for r in range(2):
        for c in range(5):
            px = -0.036 + c * 0.018
            py = -0.013 + r * 0.026
            bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.0058, location=(0.0, 0.0, 0.0))
            cap = bpy.context.active_object
            cap.scale = (1.15, 0.85, 0.55)
            apply_scale(cap)
            cap.location = (px, py, 0.0042)
            cap.data.materials.append(pill_mat)
            cap.parent = parent

    parent.location = location
    parent.rotation_euler = (0.0, 0.0, math.radians(rot_z_deg))
    return parent


def save_and_render_mp4(scene, blend_name: str, mp4_name: str, fps: int = 24, keep_frames: bool = False):
    """Save .blend, render frame sequence in EEVEE, encode clean 24fps MP4 via FFmpeg."""
    blend_path = os.path.join(SCENES_DIR, blend_name)
    mp4_path = os.path.join(OUT_DIR, mp4_name)
    frames_dir = os.path.join(OUT_DIR, f"_tmp_{os.path.splitext(mp4_name)[0]}")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir, exist_ok=True)

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    scene.render.filepath = os.path.join(frames_dir, "frame_")
    bpy.ops.render.render(animation=True)

    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", os.path.join(frames_dir, "frame_%04d.png"),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "16",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        mp4_path,
    ]
    subprocess.run(ffmpeg_cmd, check=True)
    if not keep_frames:
        shutil.rmtree(frames_dir, ignore_errors=True)
    print(f"DONE_SCENE {mp4_path} ({os.path.getsize(mp4_path)} bytes)")
    return mp4_path
