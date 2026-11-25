"""
Builds the complete StackPharmacy 3D Studio Marketing Ad Scene inside Blender 5.2.
Features:
- Dark matte satin podium (eliminates white glare overlap behind STACKPHARMACY floor text)
- Two-tone high-contrast STACKPHARMACY 3D badge on beveled dark nameplate
- Sequential staggered elastic pop-up animation (216 frames / 9s @ 24fps)
- Live 2-state Smartphone Screen transition ("AI Reading Bill..." -> "3 Medicines Extracted")
- 3 studio cameras: Poster (1080x1350), Reels 9:16 (1080x1920), Banner (1920x1080)
"""
import math
import os
import bpy
import bmesh
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(SCRIPT_DIR, "textures")
BLEND_OUT = os.path.join(SCRIPT_DIR, "StackPharmacy_Ad_Studio.blend")


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        if col != bpy.context.scene.collection:
            bpy.data.collections.remove(col)
    for datablocks in (
        bpy.data.meshes, bpy.data.materials, bpy.data.lights,
        bpy.data.cameras, bpy.data.images, bpy.data.curves
    ):
        for item in list(datablocks):
            if item.users == 0:
                datablocks.remove(item)


def make_mat(name, base_color=(0.8, 0.8, 0.8, 1.0), metallic=0.0, roughness=0.4,
             coat=0.0, emission=None, emission_strength=0.0, transmission=0.0, ior=1.45,
             specular=0.5):
    mat = bpy.data.materials.new(name=name)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = specular
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = ior
    if emission is not None and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def make_image_mat(name, img_path, roughness=0.45, coat=0.05, specular=0.15, emission_strength=0.85):
    mat = bpy.data.materials.new(name=name)
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = specular

    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(img_path, check_existing=True)
    tex.extension = 'EXTEND'

    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    if emission_strength > 0 and "Emission Color" in bsdf.inputs:
        links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def make_animated_screen_mat(name, img_scanning, img_done):
    """Creates a 2-state OLED screen material switching from scanning -> extracted items."""
    mat = bpy.data.materials.new(name=name)
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 0.55
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.03
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.08

    tex_a = nodes.new("ShaderNodeTexImage")
    tex_a.image = bpy.data.images.load(img_scanning, check_existing=True)
    tex_a.extension = 'EXTEND'

    tex_b = nodes.new("ShaderNodeTexImage")
    tex_b.image = bpy.data.images.load(img_done, check_existing=True)
    tex_b.extension = 'EXTEND'

    mix = nodes.new("ShaderNodeMix")
    mix.data_type = 'RGBA'
    links.new(tex_a.outputs["Color"], mix.inputs["A"])
    links.new(tex_b.outputs["Color"], mix.inputs["B"])
    links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    if "Emission Color" in bsdf.inputs:
        links.new(mix.outputs["Result"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = 1.05

    # Keyframe transition right as laser completes pass across bill
    mix.inputs["Factor"].default_value = 0.0
    mix.inputs["Factor"].keyframe_insert(data_path="default_value", frame=1)
    mix.inputs["Factor"].keyframe_insert(data_path="default_value", frame=80)
    mix.inputs["Factor"].default_value = 1.0
    mix.inputs["Factor"].keyframe_insert(data_path="default_value", frame=88)
    mix.inputs["Factor"].keyframe_insert(data_path="default_value", frame=216)

    return mat


def create_uv_quad(name, width, height, mat, loc=(0, 0, 0), rot=(0, 0, 0)):
    hw, hh = width / 2.0, height / 2.0
    mesh = bpy.data.meshes.new(name)
    verts = [(-hw, -hh, 0.0), (hw, -hh, 0.0), (hw, hh, 0.0), (-hw, hh, 0.0)]
    faces = [(0, 1, 2, 3)]
    mesh.from_pydata(verts, [], faces)
    uv_layer = mesh.uv_layers.new(name="UVMap")
    uvs = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    for i in range(len(mesh.loops)):
        uv_layer.data[i].uv = uvs[i]
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.location = loc
    obj.rotation_euler = rot
    return obj


def set_constant_before(obj, cutoff_frame):
    """Sets keyframe interpolation to CONSTANT before cutoff_frame (Blender 4.4+/5.x & legacy safe)."""
    ad = getattr(obj, "animation_data", None)
    if not ad or not ad.action:
        return
    act = ad.action
    fcurves = []
    if hasattr(act, "layers") and len(act.layers) > 0:
        for layer in act.layers:
            for strip in getattr(layer, "strips", []):
                if hasattr(strip, "channelbag") and ad.action_slot:
                    cb = strip.channelbag(ad.action_slot)
                    if cb:
                        fcurves.extend(cb.fcurves)
    elif hasattr(act, "fcurves"):
        fcurves.extend(act.fcurves)
    for fc in fcurves:
        for kp in fc.keyframe_points:
            if kp.co[0] < cutoff_frame:
                kp.interpolation = 'CONSTANT'


def animate_popup(obj, start_frame, duration=14, overshoot=1.12, lift_z=0.35):
    """Animates crisp hidden -> overshoot bounce pop-up onto final resting transform."""
    base_scale = tuple(obj.scale)
    base_z = obj.location.z

    # Stay hidden from frame 1 until start_frame - 1
    obj.scale = (0.0001, 0.0001, 0.0001)
    obj.location.z = base_z - lift_z
    obj.keyframe_insert(data_path="scale", frame=1)
    obj.keyframe_insert(data_path="location", index=2, frame=1)
    if start_frame > 2:
        obj.keyframe_insert(data_path="scale", frame=start_frame - 1)
        obj.keyframe_insert(data_path="location", index=2, frame=start_frame - 1)

    # Elastic overshoot peak (~68% of duration)
    peak_frame = start_frame + max(3, int(duration * 0.68))
    obj.scale = tuple(s * overshoot for s in base_scale)
    obj.location.z = base_z + lift_z * 0.14
    obj.keyframe_insert(data_path="scale", frame=peak_frame)
    obj.keyframe_insert(data_path="location", index=2, frame=peak_frame)

    # Settle into final hero rest
    end_frame = start_frame + duration
    obj.scale = base_scale
    obj.location.z = base_z
    obj.keyframe_insert(data_path="scale", frame=end_frame)
    obj.keyframe_insert(data_path="location", index=2, frame=end_frame)

    set_constant_before(obj, start_frame - 0.5)


def build_backdrop_and_stage():
    # Deep studio emerald cyclorama
    bpy.ops.mesh.primitive_plane_add(size=22, location=(0, 3.0, -0.02))
    bg = bpy.context.active_object
    bg.name = "Studio_Backdrop"
    bm = bmesh.new()
    bm.from_mesh(bg.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=28, use_grid_fill=True)
    for v in bm.verts:
        if v.co.y > 1.8:
            dy = v.co.y - 1.8
            v.co.z = max(0.0, (dy ** 1.7) * 0.35)
    bm.to_mesh(bg.data)
    bm.free()
    bpy.ops.object.shade_smooth()
    bg.data.materials.append(
        make_mat("Mat_Studio_Emerald", base_color=(0.005, 0.040, 0.035, 1.0), roughness=0.78, specular=0.06)
    )

    # Matte-satin dark obsidian-emerald pedestal (prevents harsh bright table washout!)
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.95, depth=0.24, location=(0, 0.12, -0.12))
    ped = bpy.context.active_object
    ped.name = "Stage_Pedestal"
    bev = ped.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.028
    bev.segments = 4
    bpy.ops.object.shade_smooth()
    ped.data.materials.append(
        make_mat(
            "Mat_Pedestal_DarkMatte",
            base_color=(0.004, 0.015, 0.013, 1.0),
            metallic=0.05, roughness=0.58, coat=0.04, specular=0.18
        )
    )

    # Crisp glowing mint rim accent ring
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.955, minor_radius=0.012, major_segments=96, minor_segments=16,
        location=(0, 0.12, -0.022)
    )
    ring = bpy.context.active_object
    ring.name = "Stage_Glow_Ring"
    bpy.ops.object.shade_smooth()
    ring.data.materials.append(
        make_mat("Mat_Teal_Glow", base_color=(0.17, 0.83, 0.75, 1.0),
                 emission=(0.12, 0.88, 0.74, 1.0), emission_strength=4.5)
    )


def build_smartphone(parent_empty):
    W, H, D = 0.78, 1.64, 0.072

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = "Phone_Body"
    body.scale = (W, D, H)
    bpy.ops.object.transform_apply(scale=True)
    bev = body.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.036
    bev.segments = 5
    bpy.ops.object.shade_smooth()
    body.data.materials.append(
        make_mat("Mat_Phone_Titanium", base_color=(0.08, 0.18, 0.16, 1.0), metallic=0.92, roughness=0.22, coat=0.45)
    )
    body.parent = parent_empty

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -D * 0.49, 0))
    bezel = bpy.context.active_object
    bezel.name = "Phone_Bezel"
    bezel.scale = (W - 0.04, 0.008, H - 0.04)
    bpy.ops.object.transform_apply(scale=True)
    bev2 = bezel.modifiers.new("Bevel", 'BEVEL')
    bev2.width = 0.022
    bev2.segments = 4
    bpy.ops.object.shade_smooth()
    bezel.data.materials.append(
        make_mat("Mat_Black_Glass", base_color=(0.008, 0.01, 0.012, 1.0), metallic=0.05, roughness=0.14, coat=0.4, specular=0.3)
    )
    bezel.parent = parent_empty

    screen_mat = make_animated_screen_mat(
        "Mat_Phone_Screen",
        os.path.join(TEX_DIR, "phone_screen_scanning.png"),
        os.path.join(TEX_DIR, "phone_screen_scanner.png"),
    )
    sw = W - 0.078
    sh = sw * (2280.0 / 1080.0)
    if sh > H - 0.078:
        sh = H - 0.078
        sw = sh * (1080.0 / 2280.0)
    scr = create_uv_quad(
        "Phone_Screen", sw, sh, screen_mat,
        loc=(0, -D * 0.56, 0), rot=(math.radians(90), 0, 0)
    )
    scr.parent = parent_empty

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=24, radius=0.012, depth=0.003,
        location=(0, -D * 0.564, sh * 0.474),
        rotation=(math.radians(90), 0, 0)
    )
    cam_dot = bpy.context.active_object
    cam_dot.name = "Phone_Front_Camera"
    bpy.ops.object.shade_smooth()
    cam_dot.data.materials.append(make_mat("Mat_Cam_Black", base_color=(0.003, 0.003, 0.003, 1.0), roughness=0.2))
    cam_dot.parent = parent_empty


def build_paper_bill_and_scanner():
    bill_empty = bpy.data.objects.new("Paper_Bill_Rig", None)
    bpy.context.collection.objects.link(bill_empty)
    bill_empty.location = (-0.64, -0.26, 1.04)
    bill_empty.rotation_euler = (math.radians(-4), math.radians(8), math.radians(20))

    bill_mat = make_image_mat(
        "Mat_Paper_Bill",
        os.path.join(TEX_DIR, "distributor_bill_paper.png"),
        roughness=0.86, coat=0.0, specular=0.05, emission_strength=0.42
    )
    bill_w = 0.60
    bill_h = bill_w * (1340.0 / 960.0)
    bill = create_uv_quad(
        "Paper_Invoice", bill_w, bill_h, bill_mat,
        loc=(0, 0, 0), rot=(math.radians(90), 0, 0)
    )
    sol = bill.modifiers.new("Solidify", 'SOLIDIFY')
    sol.thickness = 0.004
    bill.parent = bill_empty

    # Pop up bill at frame 18..32
    animate_popup(bill_empty, start_frame=18, duration=14, overshoot=1.10, lift_z=0.40)

    # Glowing AI Laser Scanner Bar
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=24, radius=0.009, depth=bill_w + 0.12,
        location=(0, -0.024, 0.34), rotation=(0, math.radians(90), 0)
    )
    laser = bpy.context.active_object
    laser.name = "AI_Laser_Beam"
    bpy.ops.object.shade_smooth()
    laser.data.materials.append(
        make_mat("Mat_Laser_Cyan", base_color=(0.18, 0.96, 0.84, 1.0),
                 emission=(0.1, 1.0, 0.80, 1.0), emission_strength=18.0)
    )
    laser.parent = bill_empty

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -0.02, 0.34), rotation=(math.radians(90), 0, 0))
    halo = bpy.context.active_object
    halo.name = "AI_Laser_Halo"
    halo.scale = (bill_w + 0.04, 0.11, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    halo_mat = bpy.data.materials.new("Mat_Scan_Halo")
    bsdf = halo_mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.1, 0.95, 0.78, 1.0)
    bsdf.inputs["Emission Color"].default_value = (0.1, 0.95, 0.78, 1.0)
    bsdf.inputs["Emission Strength"].default_value = 3.0
    bsdf.inputs["Alpha"].default_value = 0.25
    halo.data.materials.append(halo_mat)
    halo.parent = bill_empty

    # Laser pops on at frame 60, sweeps down bill (62..96), sweeps back nicely to rest across bill!
    for obj in (laser, halo):
        obj.scale = (0.0001, 0.0001, 0.0001)
        obj.location.z = 0.35
        obj.keyframe_insert(data_path="scale", frame=1)
        obj.keyframe_insert(data_path="scale", frame=58)
        obj.keyframe_insert(data_path="location", index=2, frame=58)

        obj.scale = (1.0, 1.0, 1.0)
        obj.keyframe_insert(data_path="scale", frame=63)
        obj.keyframe_insert(data_path="location", index=2, frame=63)

        obj.location.z = -0.35
        obj.keyframe_insert(data_path="location", index=2, frame=96)

        obj.location.z = 0.04
        obj.keyframe_insert(data_path="location", index=2, frame=130)
        obj.keyframe_insert(data_path="location", index=2, frame=216)

        set_constant_before(obj, 58.5)

    return bill_empty


def create_capsule(name, loc, rot, scale=1.0):
    cap_empty = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(cap_empty)
    cap_empty.location = loc
    cap_empty.rotation_euler = rot
    cap_empty.scale = (scale, scale, scale)

    mat_mint = make_mat("Mat_Cap_Mint", base_color=(0.14, 0.68, 0.62, 1.0), metallic=0.05, roughness=0.14, coat=0.8)
    mat_white = make_mat("Mat_Cap_White", base_color=(0.95, 0.98, 0.97, 1.0), metallic=0.02, roughness=0.12, coat=0.85)

    def half_capsule(part_name, z_offset, flip_sign, mat):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=0.135, location=(0, 0, z_offset))
        obj = bpy.context.active_object
        obj.name = part_name
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        for v in bm.verts:
            if (v.co.z * flip_sign) > 0.001:
                v.co.z += 0.135 * flip_sign
            elif (v.co.z * flip_sign) < -0.001:
                v.co.z *= 0.12
        bm.to_mesh(obj.data)
        bm.free()
        bpy.ops.object.shade_smooth()
        obj.data.materials.append(mat)
        obj.parent = cap_empty
        return obj

    half_capsule(f"{name}_Top", 0.008, 1.0, mat_mint)
    half_capsule(f"{name}_Bottom", -0.008, -1.0, mat_white)
    return cap_empty


def build_pharma_props():
    # 1. Amber Glass Syrup Bottle under single Rig empty for clean pop-up
    syrup_rig = bpy.data.objects.new("Syrup_Bottle_Rig", None)
    bpy.context.collection.objects.link(syrup_rig)
    syrup_rig.location = (-1.28, 0.12, 0.0)

    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.22, depth=0.60, location=(0, 0, 0.30))
    bottle = bpy.context.active_object
    bottle.name = "Syrup_Bottle"
    bev = bottle.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.04
    bev.segments = 5
    bpy.ops.object.shade_smooth()
    bottle.data.materials.append(
        make_mat("Mat_Amber_Glass", base_color=(0.42, 0.14, 0.02, 1.0), roughness=0.06, transmission=0.80, ior=1.52, coat=0.8)
    )
    bottle.parent = syrup_rig

    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.105, depth=0.14, location=(0, 0, 0.67))
    cap = bpy.context.active_object
    cap.name = "Syrup_Bottle_Cap"
    bev_c = cap.modifiers.new("Bevel", 'BEVEL')
    bev_c.width = 0.015
    bev_c.segments = 3
    bpy.ops.object.shade_smooth()
    cap.data.materials.append(
        make_mat("Mat_Cap_Alum", base_color=(0.88, 0.90, 0.92, 1.0), metallic=0.9, roughness=0.22)
    )
    cap.parent = syrup_rig

    label_mesh = bpy.data.meshes.new("Syrup_Label_Mesh")
    segs = 32
    r_lbl = 0.223
    z0, z1 = 0.11, 0.48
    ang_start = math.radians(-140)
    ang_end = math.radians(-25)
    verts, faces = [], []
    for i in range(segs + 1):
        t = i / segs
        a = ang_start + t * (ang_end - ang_start)
        x = r_lbl * math.cos(a)
        y = r_lbl * math.sin(a)
        verts.append((x, y, z0))
        verts.append((x, y, z1))
    for i in range(segs):
        v0 = i * 2
        faces.append((v0, v0 + 2, v0 + 3, v0 + 1))
    label_mesh.from_pydata(verts, [], faces)
    uv_layer = label_mesh.uv_layers.new(name="UVMap")
    for fi, poly in enumerate(label_mesh.polygons):
        u0, u1 = fi / segs, (fi + 1) / segs
        uvs = [(u0, 0.0), (u1, 0.0), (u1, 1.0), (u0, 1.0)]
        for li, loop_idx in enumerate(poly.loop_indices):
            uv_layer.data[loop_idx].uv = uvs[li]
    lbl_obj = bpy.data.objects.new("Syrup_Label", label_mesh)
    bpy.context.collection.objects.link(lbl_obj)
    lbl_obj.data.materials.append(
        make_image_mat("Mat_Syrup_Label", os.path.join(TEX_DIR, "syrup_bottle_label.png"),
                       roughness=0.55, coat=0.05, specular=0.15, emission_strength=0.22)
    )
    lbl_obj.parent = syrup_rig

    # Pop up Syrup Bottle at frame 28..42
    animate_popup(syrup_rig, start_frame=28, duration=14, overshoot=1.10, lift_z=0.30)

    # 2. DOLO-650 Medicine Box
    box_empty = bpy.data.objects.new("Medicine_Box_Rig", None)
    bpy.context.collection.objects.link(box_empty)
    box_empty.location = (1.16, 0.22, 0.0)
    box_empty.rotation_euler = (0, 0, math.radians(-26))

    bw, bd, bh = 0.72, 0.28, 0.46
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, bh / 2.0))
    mbox = bpy.context.active_object
    mbox.name = "Medicine_Box"
    mbox.scale = (bw, bd, bh)
    bpy.ops.object.transform_apply(scale=True)
    bev_b = mbox.modifiers.new("Bevel", 'BEVEL')
    bev_b.width = 0.012
    bev_b.segments = 3
    bpy.ops.object.shade_smooth()
    mbox.data.materials.append(
        make_mat("Mat_Box_Body", base_color=(0.94, 0.97, 0.96, 1.0), roughness=0.45, coat=0.1)
    )
    mbox.parent = box_empty

    box_mat = make_image_mat("Mat_Box_Front", os.path.join(TEX_DIR, "med_box_front.png"),
                             roughness=0.48, coat=0.05, specular=0.1, emission_strength=0.25)
    bfront = create_uv_quad(
        "Medicine_Box_Front", bw - 0.02, bh - 0.02, box_mat,
        loc=(0, -bd / 2.0 - 0.002, bh / 2.0), rot=(math.radians(90), 0, 0)
    )
    bfront.parent = box_empty

    # Pop up Medicine Box right after Bottle (frame 34..48)
    animate_popup(box_empty, start_frame=34, duration=14, overshoot=1.10, lift_z=0.30)

    # 3. Signature Floating Capsules popping in smoothly in stagger
    hero_cap = create_capsule(
        "Hero_Capsule",
        loc=(1.08, -0.18, 1.38),
        rot=(math.radians(20), math.radians(48), math.radians(-16)),
        scale=0.92
    )
    animate_popup(hero_cap, start_frame=40, duration=12, overshoot=1.18, lift_z=0.28)

    c2 = create_capsule(
        "Accent_Capsule_1",
        loc=(-1.12, -0.05, 1.62),
        rot=(math.radians(-28), math.radians(-38), math.radians(15)),
        scale=0.65
    )
    animate_popup(c2, start_frame=44, duration=12, overshoot=1.18, lift_z=0.25)

    c3 = create_capsule(
        "Accent_Capsule_2",
        loc=(0.76, -0.58, 0.13),
        rot=(math.radians(82), math.radians(12), math.radians(40)),
        scale=0.55
    )
    animate_popup(c3, start_frame=48, duration=12, overshoot=1.18, lift_z=0.18)

    # Gentle float rotation after pop-in settles
    for idx, cap_obj in enumerate([hero_cap, c2]):
        r0 = cap_obj.rotation_euler.z
        cap_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=60)
        cap_obj.rotation_euler.z = r0 + math.radians(24 if idx == 0 else -20)
        cap_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=140)
        cap_obj.rotation_euler.z = r0 + math.radians(42 if idx == 0 else -36)
        cap_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=216)


def build_3d_brand_text():
    """High-contrast 3D STACKPHARMACY badge sitting cleanly on a dark emerald plinth bar."""
    badge_rig = bpy.data.objects.new("Brand_Badge_Rig", None)
    bpy.context.collection.objects.link(badge_rig)
    badge_rig.location = (0.0, -1.26, 0.02)

    # Dark sleek beveled nameplate plinth bar behind the glowing text so text NEVER blends into floor
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.03, 0.085))
    plinth = bpy.context.active_object
    plinth.name = "Brand_Nameplate_Bar"
    plinth.scale = (2.35, 0.11, 0.24)
    bpy.ops.object.transform_apply(scale=True)
    bev = plinth.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.02
    bev.segments = 4
    bpy.ops.object.shade_smooth()
    plinth.data.materials.append(
        make_mat("Mat_Nameplate_Dark", base_color=(0.004, 0.032, 0.027, 1.0), metallic=0.25, roughness=0.38, coat=0.35)
    )
    plinth.parent = badge_rig

    # Upright vivid Mint-White glowing extruded text on front of the dark nameplate
    bpy.ops.object.text_add(location=(0.0, -0.028, 0.03), rotation=(math.radians(86), 0, 0))
    txt = bpy.context.active_object
    txt.name = "Brand_3D_Logo_Text"
    txt.data.body = "STACKPHARMACY"
    txt.data.align_x = 'CENTER'
    txt.data.size = 0.215
    txt.data.extrude = 0.022
    txt.data.bevel_depth = 0.004
    txt.data.space_character = 1.08
    font_path = r"C:\Windows\Fonts\segoeuib.ttf"
    if os.path.exists(font_path):
        txt.data.font = bpy.data.fonts.load(font_path)
    txt.data.materials.append(
        make_mat(
            "Mat_Logo_Text_MintGlow",
            base_color=(0.85, 1.0, 0.96, 1.0),
            metallic=0.05, roughness=0.20,
            emission=(0.30, 0.96, 0.84, 1.0), emission_strength=1.55
        )
    )
    txt.parent = badge_rig

    # Brand badge pops in first at frame 4..18!
    animate_popup(badge_rig, start_frame=4, duration=14, overshoot=1.10, lift_z=0.22)


def build_lighting():
    world = bpy.data.worlds.new("Studio_World")
    bpy.context.scene.world = world
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.010, 0.048, 0.042, 1.0)
    bg.inputs["Strength"].default_value = 0.65

    def add_area(name, loc, target, energy, color, size=3.0, glossy=True):
        bpy.ops.object.light_add(type='AREA', location=loc)
        l = bpy.context.active_object
        l.name = name
        l.data.energy = energy
        l.data.color = color
        l.data.size = size
        l.visible_glossy = glossy
        direction = Vector(target) - Vector(loc)
        l.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        return l

    add_area("Light_Key_Main", (-4.4, -3.2, 4.4), (0, 0, 0.8), 850, (1.0, 0.98, 0.95), size=3.6, glossy=False)
    add_area("Light_Fill_Mint", (4.2, -2.5, 2.8), (0, 0, 0.8), 420, (0.55, 0.96, 0.88), size=3.4, glossy=False)
    add_area("Light_Rim_Back", (0.1, 3.6, 2.9), (0, 0, 0.85), 1000, (0.65, 1.0, 0.92), size=2.8, glossy=True)
    add_area("Light_Top_Halo", (0, 0.8, 4.5), (0, 0, 0.7), 280, (0.95, 1.0, 1.0), size=2.4, glossy=False)


def build_cameras():
    target = bpy.data.objects.new("Camera_Target", None)
    bpy.context.collection.objects.link(target)
    target.location = (-0.04, 0.0, 0.88)

    def add_cam(name, loc, lens=50):
        bpy.ops.object.camera_add(location=loc)
        cam = bpy.context.active_object
        cam.name = name
        cam.data.lens = lens
        c = cam.constraints.new('TRACK_TO')
        c.target = target
        c.track_axis = 'TRACK_NEGATIVE_Z'
        c.up_axis = 'UP_Y'
        return cam

    cam_poster = add_cam("Cam_Poster_Portrait", (-0.08, -5.75, 1.38), lens=48)

    # Reels 9:16 smooth orbital camera across frames 1..216
    cam_reels = add_cam("Cam_Reels_Vertical", (-0.75, -6.60, 1.56), lens=40)
    cam_reels.keyframe_insert(data_path="location", frame=1)
    cam_reels.location = (0.02, -5.95, 1.28)
    cam_reels.keyframe_insert(data_path="location", frame=110)
    cam_reels.location = (0.48, -6.30, 1.38)
    cam_reels.keyframe_insert(data_path="location", frame=216)

    target_wide = bpy.data.objects.new("Camera_Target_Wide", None)
    bpy.context.collection.objects.link(target_wide)
    target_wide.location = (-0.85, 0.0, 0.84)
    bpy.ops.object.camera_add(location=(-1.05, -5.85, 1.32))
    cam_wide = bpy.context.active_object
    cam_wide.name = "Cam_Banner_Wide"
    cam_wide.data.lens = 42
    cw = cam_wide.constraints.new('TRACK_TO')
    cw.target = target_wide
    cw.track_axis = 'TRACK_NEGATIVE_Z'
    cw.up_axis = 'UP_Y'

    bpy.context.scene.camera = cam_poster


def build_all():
    clear_scene()
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 216
    scene.render.fps = 24

    build_backdrop_and_stage()

    phone_empty = bpy.data.objects.new("Hero_Phone_Rig", None)
    bpy.context.collection.objects.link(phone_empty)
    phone_empty.location = (0.24, -0.02, 0.96)
    phone_empty.rotation_euler = (math.radians(-4), math.radians(-3), math.radians(-12))
    build_smartphone(phone_empty)

    # Pop up hero smartphone at frame 48..62
    animate_popup(phone_empty, start_frame=48, duration=14, overshoot=1.08, lift_z=0.55)

    # Subtle hero float after settling
    phone_empty.keyframe_insert(data_path="location", index=2, frame=64)
    phone_empty.location.z = 1.01
    phone_empty.keyframe_insert(data_path="location", index=2, frame=140)
    phone_empty.location.z = 0.96
    phone_empty.keyframe_insert(data_path="location", index=2, frame=216)

    build_paper_bill_and_scanner()
    build_pharma_props()
    build_3d_brand_text()
    build_lighting()
    build_cameras()

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    prefs = bpy.context.preferences.addons.get('cycles')
    if prefs:
        cp = prefs.preferences
        cp.compute_device_type = 'OPTIX'
        cp.refresh_devices()
        for dev in cp.devices:
            dev.use = (dev.type == 'OPTIX')
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1350
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'

    # Park at frame 150 (all props popped in, phone screen extracted, laser visible on bill)
    bpy.context.scene.frame_set(150)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
    print(f"Scene built and saved to {BLEND_OUT}")


if __name__ == "__main__":
    build_all()
