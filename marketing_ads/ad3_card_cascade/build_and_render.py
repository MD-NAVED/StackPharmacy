"""
Builds & renders Ad #3: StackPharmacy 3D Stacked Card Cascade Reel (1080x1920, 30fps, 8.0s loop)
inspired by Video 4 (Noteform fanned cascade) using Blender 5.2 EEVEE Next + FFmpeg audio mux.

Usage inside Blender:
    blender --background --python marketing_ads/ad3_card_cascade/build_and_render.py -- preview
    blender --background --python marketing_ads/ad3_card_cascade/build_and_render.py -- render
"""

import math
import os
import shutil
import subprocess
import sys
import bpy
import bmesh
from mathutils import Euler, Vector

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(BASE_DIR, "textures")
OUT_DIR = os.path.join(BASE_DIR, "outputs")
PREV_DIR = os.path.join(OUT_DIR, "previews")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(PREV_DIR, exist_ok=True)

BLEND_OUT = os.path.join(BASE_DIR, "StackPharmacy_Ad3_CardCascade.blend")
MP4_SILENT = os.path.join(OUT_DIR, "_tmp_silent_cascade.mp4")
MP4_FINAL = os.path.join(OUT_DIR, "StackPharmacy_CardCascade_Reels_1080x1920.mp4")
WAV_IN = os.path.join(TEX_DIR, "audio_cascade_8s.wav")

CARD_W = 1.98
CARD_H = 1.21
CARD_THICK = 0.011
CARD_R = 0.048

N_CARDS = 6
TOTAL_FRAMES = 240  # 8.0s @ 30fps seamless Up <-> Down loop
FPS = 30

# Ordered Top (idx=0) -> Bottom (idx=5) just like Noteform diagonal cascade:
# Top emerald offer ("1") -> Dark Expiry -> White Workflow -> Obsidian Metrics ->
# Forest Brand + Shield -> Bottom Sage Khata
CARD_SPECS = [
    ("Card_1_Offer",   "card_6_offer.png",   (0.02, 0.24, 0.21, 1.0)),
    ("Card_2_Expiry",  "card_4_expiry.png",  (0.02, 0.12, 0.11, 1.0)),
    ("Card_3_Process", "card_3_process.png", (0.86, 0.90, 0.89, 1.0)),
    ("Card_4_Metrics", "card_2_metrics.png", (0.04, 0.07, 0.07, 1.0)),
    ("Card_5_Brand",   "card_1_brand.png",   (0.01, 0.14, 0.12, 1.0)),
    ("Card_6_POS",     "card_5_pos.png",     (0.76, 0.88, 0.81, 1.0)),
]


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_card_material(name: str, tex_path: str, edge_rgba):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.64
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.22
    bsdf.inputs["Coat Weight"].default_value = 0.05
    bsdf.inputs["Coat Roughness"].default_value = 0.24
    bsdf.inputs["Emission Strength"].default_value = 0.66

    tex = nt.nodes.new("ShaderNodeTexImage")
    img = bpy.data.images.load(tex_path, check_existing=True)
    tex.image = img
    tex.extension = 'CLIP'

    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    # Side/rim edge material
    emat = bpy.data.materials.new(name + "_Edge")
    emat.use_nodes = True
    eb = next(n for n in emat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    eb.inputs["Base Color"].default_value = edge_rgba
    eb.inputs["Roughness"].default_value = 0.30
    eb.inputs["Coat Weight"].default_value = 0.40
    return mat, emat


def create_3d_card(name: str, mat_face, mat_edge):
    """Build clean beveled rounded landscape slab in local XY plane with exact [0,1] UVs."""
    mesh = bpy.data.meshes.new(name + "_mesh")
    bm = bmesh.new()

    hw = CARD_W * 0.5
    hh = CARD_H * 0.5
    r = min(CARD_R, hw * 0.4, hh * 0.4)
    segs = 10

    corners = [
        ( hw - r,  hh - r, 0.0, math.pi * 0.5),
        (-hw + r,  hh - r, math.pi * 0.5, math.pi),
        (-hw + r, -hh + r, math.pi, math.pi * 1.5),
        ( hw - r, -hh + r, math.pi * 1.5, math.pi * 2.0),
    ]
    pts = []
    for cx, cy, a0, a1 in corners:
        for i in range(segs + 1):
            a = a0 + (a1 - a0) * (i / segs)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))

    # Top face (+Z/2)
    top_verts = [bm.verts.new((x, y, CARD_THICK * 0.5)) for x, y in pts]
    bot_verts = [bm.verts.new((x, y, -CARD_THICK * 0.5)) for x, y in pts]
    f_top = bm.faces.new(top_verts)
    f_top.material_index = 0
    f_bot = bm.faces.new(list(reversed(bot_verts)))
    f_bot.material_index = 1

    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        sf = bm.faces.new([top_verts[j], top_verts[i], bot_verts[i], bot_verts[j]])
        sf.material_index = 1

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    # Exact planar UV mapping on front top face from local bounds [-hw,+hw] x [-hh,+hh]
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        if f.material_index == 0:
            for loop in f.loops:
                vx, vy, _ = loop.vert.co
                u = (vx / CARD_W) + 0.5
                v = (vy / CARD_H) + 0.5
                loop[uv_layer].uv = (u, v)

    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_face)
    obj.data.materials.append(mat_edge)

    # Smooth edges + bevel for glossy catchlights
    for p in obj.data.polygons:
        p.use_smooth = True
    bev = obj.modifiers.new("RimBevel", 'BEVEL')
    bev.width = 0.0022
    bev.segments = 3
    bev.limit_method = 'ANGLE'
    bev.angle_limit = math.radians(35.0)
    return obj


def smooth_step5(x: float) -> float:
    """Quintic C2 ease (zero jerk at start/end of every Up and Down travel)."""
    x = max(0.0, min(1.0, x))
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0)


def up_down_wave(tau: float) -> float:
    """
    Seamless 0..1..0 Up-and-Down accordion envelope over tau in [0, 1):
      0.00..0.06 : settled Down pose (showcases top cards cleanly)
      0.06..0.44 : silky ease UP to Peak UP pose
      0.44..0.56 : poised linger at Peak UP (showcases lower brand/offer cards cleanly)
      0.56..0.94 : silky ease DOWN back to resting start
      0.94..1.00 : settled Down linger -> exact match at frame 1 & frame 240
    """
    tau = tau % 1.0
    if tau < 0.06:
        return 0.0
    if tau < 0.44:
        return smooth_step5((tau - 0.06) / 0.38)
    if tau < 0.56:
        return 1.0
    if tau < 0.94:
        return 1.0 - smooth_step5((tau - 0.56) / 0.38)
    return 0.0


def slot_motion(frame_zero_based: int, card_idx: int):
    """
    True Up-and-Down Accordion Cascade (locked studio camera, zero circular wheel):
    Every card glides distinctly UPWARD during w=0->1 (+0.29m to +1.59m vertical travel)
    while unfolding open (spacing_y 0.80 -> 1.06), then glides smoothly BACK DOWN to base.
    """
    tau_base = frame_zero_based / float(TOTAL_FRAMES)

    # Sequential accordion ripple across the 6 cards (~6 frames stagger from top to bottom)
    lag = (card_idx - 2.5) * 0.025
    w = up_down_wave(tau_base - lag)

    # Normalized stack coordinate u_base from +2.5 (Top card) down to -2.5 (Bottom card)
    u_base = 2.5 - float(card_idx)

    # Unfolding spacing (0.80 compact Down -> 1.06 open Up) + vertical elevator glide (-0.52 -> +0.42)
    spacing_y = 0.80 + 0.26 * w
    y_glide = -0.52 + 0.94 * w

    cy = u_base * spacing_y + y_glide

    # Graceful subtle editorial C-curve spine along Y (zero circular spin)
    norm_y = cy / 2.8
    cx = 0.20 - 0.30 * (norm_y * norm_y) * 0.65 - 0.04 * norm_y

    # Top-forward shingling (+5.2 deg pitch around X + rising Z step +0.055 per card)
    cz = 0.14 + float(card_idx) * 0.055 + 0.012 * math.sin(2.0 * math.pi * tau_base - card_idx * 0.35)

    # Crisp diagonal fan angles (+14.5 deg top down to -16.5 deg bottom) + gentle ±1.8 deg dynamic breath
    base_yaw_deg = u_base * 6.2 - 1.0
    breath_yaw_deg = 1.8 * (w - 0.5) * (1.0 if (card_idx % 2 == 0) else -0.6)
    yaw = math.radians(base_yaw_deg + breath_yaw_deg)

    pitch = math.radians(+5.2 + 0.8 * w)
    roll = math.radians(-1.0 + 0.6 * w)
    return (cx, cy, cz), Euler((pitch, roll, yaw), 'YXZ')


def build_scene():
    clear_scene()
    scene = bpy.context.scene

    # Bright cool-studio tabletop floor catching soft shadows
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0.0, 0.0, -0.15))
    floor = bpy.context.active_object
    floor.name = "Studio_Backdrop"
    fmat = bpy.data.materials.new("Mat_Studio_Floor")
    fmat.use_nodes = True
    fbsdf = next(n for n in fmat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    fbsdf.inputs["Base Color"].default_value = (0.83, 0.85, 0.84, 1.0)
    fbsdf.inputs["Roughness"].default_value = 0.90
    floor.data.materials.append(fmat)

    # Create 6 3D rounded cards + textures
    cards = []
    for idx, (cname, fname, edge_col) in enumerate(CARD_SPECS):
        tex_path = os.path.join(TEX_DIR, fname)
        m_face, m_edge = make_card_material(f"Mat_{cname}", tex_path, edge_col)
        cobj = create_3d_card(cname, m_face, m_edge)
        cards.append((idx, cobj))

    # Animate all 240 frames cleanly with LINEAR keyframes of exact eased slot curve
    scene.frame_start = 1
    scene.frame_end = TOTAL_FRAMES
    scene.render.fps = FPS
    for f in range(1, TOTAL_FRAMES + 1):
        for idx, cobj in cards:
            loc, eul = slot_motion(f - 1, idx)
            cobj.location = loc
            cobj.rotation_mode = 'YXZ'
            cobj.rotation_euler = eul
            cobj.keyframe_insert(data_path="location", frame=f)
            cobj.keyframe_insert(data_path="rotation_euler", frame=f)

    # Set linear interpolation so pre-computed sine ease stays accurate frame-for-frame
    for _, cobj in cards:
        if cobj.animation_data and cobj.animation_data.action:
            act = cobj.animation_data.action
            # Blender 5 layered actions or fcurves compatibility
            fcurves = getattr(act, "fcurves", [])
            if not fcurves and hasattr(act, "layers"):
                for lyr in act.layers:
                    for st in lyr.strips:
                        for bag in st.channelbags:
                            fcurves.extend(bag.fcurves)
            for fc in fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'LINEAR'

    # Lighting: soft top-left studio sun/area key + clean soft fill + edge rim
    def add_light(name, ltype, loc, target, energy, size=6.0, color=(1.0, 1.0, 1.0)):
        ld = bpy.data.lights.new(name, ltype)
        ld.energy = energy
        ld.color = color
        if ltype == 'AREA':
            ld.size = size
        lo = bpy.data.objects.new(name, ld)
        scene.collection.objects.link(lo)
        lo.location = loc
        lo.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        return lo

    add_light("Key_TopLeft", 'AREA', (-5.8, 4.4, 5.2), (0.0, 0.0, 0.25), 480.0, 5.5, (1.0, 0.99, 0.98))
    add_light("Fill_Right",  'AREA', ( 4.8, -2.5, 5.2), (0.0, 0.0, 0.25), 200.0, 7.0, (0.94, 0.99, 0.98))
    add_light("Rim_Bottom",  'AREA', ( 0.0, -5.2, 3.2), (0.0, 0.0, 0.25), 140.0, 5.0, (0.88, 1.00, 0.96))

    # World gentle studio bounce
    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    wbg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    wbg.inputs["Color"].default_value = (0.83, 0.85, 0.84, 1.0)
    wbg.inputs["Strength"].default_value = 0.72

    # Vertical 9:16 Studio Camera aligned on same X axis (dx=0 => zero roll twist, center card stays dead horizontal!)
    cd = bpy.data.cameras.new("Cam_Cascade")
    cd.lens = 35.0
    cam = bpy.data.objects.new("Cam_Cascade", cd)
    scene.collection.objects.link(cam)
    scene.camera = cam

    for f in range(1, TOTAL_FRAMES + 1):
        phase = 2.0 * math.pi * ((f - 1) / float(TOTAL_FRAMES))
        # Locked studio camera height so user clearly sees the entire stack glide Up & Down!
        cam_z = 7.12 - 0.06 * math.sin(phase)
        cam_x = 0.02 + 0.015 * math.sin(phase)
        cam_loc = Vector((cam_x, -0.22, cam_z))
        tgt = Vector((cam_x, 0.04, 0.28))
        cam.location = cam_loc
        q = (tgt - cam_loc).to_track_quat('-Z', 'Y')
        cam.rotation_mode = 'XYZ'
        cam.rotation_euler = q.to_euler()
        cam.keyframe_insert(data_path="location", frame=f)
        cam.keyframe_insert(data_path="rotation_euler", frame=f)

    # EEVEE Next render settings
    scene.render.engine = 'BLENDER_EEVEE'
    scene.eevee.taa_render_samples = 16
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    try:
        scene.view_settings.view_transform = 'AgX'
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
    scene.view_settings.exposure = 0.05

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
    print("SAVED_BLEND:", BLEND_OUT)


def render_previews():
    scene = bpy.context.scene
    scene.render.image_settings.file_format = 'PNG'
    for f in (1, 60, 120):
        scene.frame_set(f)
        out = os.path.join(PREV_DIR, f"prev_ad3_f{f:03d}.png")
        scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
        print("PREVIEW_RENDERED:", out)


def render_full_video():
    scene = bpy.context.scene
    frames_dir = os.path.join(OUT_DIR, "_tmp_frames")
    os.makedirs(frames_dir, exist_ok=True)
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(frames_dir, "frame_")
    bpy.ops.render.render(animation=True)
    print("BLENDER_FRAMES_DONE")

    # Encode 30fps crisp MP4 + mux 8s audio loop via FFmpeg
    subprocess.run([
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(frames_dir, "frame_%04d.png"),
        "-i", WAV_IN,
        "-filter_complex", "[1:a]loudnorm=I=-14:TP=-1.5:LRA=7[aout]",
        "-map", "0:v:0",
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
        MP4_FINAL,
    ], check=True)
    shutil.rmtree(frames_dir, ignore_errors=True)
    print("FINAL_AD3_VIDEO:", MP4_FINAL, os.path.getsize(MP4_FINAL))


def main():
    argv = sys.argv
    mode = argv[argv.index("--") + 1] if "--" in argv and len(argv) > argv.index("--") + 1 else "preview"
    build_scene()
    if mode == "preview":
        render_previews()
    elif mode == "render":
        render_full_video()
    else:
        raise ValueError(f"Unknown mode: {mode}")


if __name__ == "__main__":
    main()
