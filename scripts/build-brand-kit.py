"""
Builds the unified StackPharmacy Option D (Minimal Flat Card Stack + Medical Cross) Brand Kit,
Web/PWA icons, crisp UI mark, Android native launcher & splash assets, GitHub README banner,
and Desktop export folder directly from canonical SVG masters rendered via Chrome.

Usage:
    python scripts/build-brand-kit.py
"""

import glob
import math
import os
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BRAND_DIR = os.path.join(ROOT, "brand")
PUBLIC_DIR = os.path.join(ROOT, "client", "public")
RES_DIR = os.path.join(ROOT, "client", "android", "app", "src", "main", "res")
DESKTOP_KIT = os.path.join(os.path.expanduser("~"), "Desktop", "StackPharmacy_Brand_Kit")
TMP_SVG_DIR = os.path.join(BRAND_DIR, "_svg_renders")

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_SEMI = "C:/Windows/Fonts/segoeuisb.ttf"
FONT_REG = "C:/Windows/Fonts/segoeui.ttf"


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    for p in (path, FONT_BOLD, FONT_REG, "C:/Windows/Fonts/arialbd.ttf"):
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def trim_alpha(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im


def pad_to_square(img: Image.Image, target_size: int, fill_ratio: float = 0.84) -> Image.Image:
    cw, ch = img.size
    max_dim = max(cw, ch)
    scale = (target_size * fill_ratio) / max_dim
    nw, nh = int(round(cw * scale)), int(round(ch * scale))
    resized = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    canvas.paste(resized, ((target_size - nw) // 2, (target_size - nh) // 2), resized)
    return canvas


def make_squircle_mask(size: int, radius_ratio: float = 0.22) -> Image.Image:
    ss = size * 4
    r = int(round(ss * radius_ratio))
    mask = Image.new("L", (ss, ss), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, ss - 1, ss - 1], radius=r, fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def make_circle_mask(size: int) -> Image.Image:
    ss = size * 4
    mask = Image.new("L", (ss, ss), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([0, 0, ss - 1, ss - 1], fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def compose_light_tile(mark_light: Image.Image, size: int, fill_ratio: float = 0.72) -> Image.Image:
    """Clean clinical off-white #F4FAF7 studio tile showcasing authentic Option D colors."""
    canvas = Image.new("RGBA", (size, size), (244, 250, 247, 255))
    icon = pad_to_square(mark_light, size, fill_ratio=fill_ratio)
    canvas.alpha_composite(icon)
    return canvas


def apply_mask(img: Image.Image, mask: Image.Image) -> Image.Image:
    size = mask.size[0]
    base = img.resize((size, size), Image.LANCZOS).convert("RGBA")
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    return out


def draw_vertical_lockup(mark_light: Image.Image, dark_text: bool = True) -> Image.Image:
    W, H = 1400, 1120
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)

    mark_h = 470
    mw, mh = mark_light.size
    mark_w = int(round(mw * mark_h / mh))
    tx, ty = (W - mark_w) // 2, 108

    canvas.alpha_composite(mark_light.resize((mark_w, mark_h), Image.LANCZOS), (tx, ty))

    f_stack = load_font(FONT_BOLD, 148)
    f_pharma = load_font(FONT_SEMI, 148)
    f_tag = load_font(FONT_SEMI, 38)

    c_stack = (5, 59, 54, 255) if dark_text else (255, 255, 255, 255)
    c_pharma = (14, 131, 120, 255) if dark_text else (128, 203, 196, 255)
    c_tag = (71, 85, 105, 235) if dark_text else (204, 242, 236, 235)

    ws = d.textlength("Stack", font=f_stack)
    wp = d.textlength("Pharmacy", font=f_pharma)
    wx = (W - (ws + wp)) / 2.0
    wy = 626
    d.text((wx, wy), "Stack", font=f_stack, fill=c_stack)
    d.text((wx + ws, wy), "Pharmacy", font=f_pharma, fill=c_pharma)

    tag = "SMART STOCK & EXPIRY GUARD"
    wt = d.textlength(tag, font=f_tag)
    d.text(((W - wt) / 2.0, 824), tag, font=f_tag, fill=c_tag)
    return canvas


def draw_readme_banner(mark_dark: Image.Image) -> Image.Image:
    """Sleek 1280x360 emerald banner featuring crisp flat Option D mark."""
    W, H = 1280, 360
    bg = Image.new("RGBA", (W, H), (5, 42, 38, 255))
    px = bg.load()
    for y in range(H):
        for x in range(W):
            u = x / W
            v = y / H
            glow = max(0.0, 1.0 - math.hypot((x - 195) / 340.0, (y - 180) / 220.0))
            r = int(min(255, 3 + 14 * u + 20 * (glow ** 1.65)))
            g = int(min(255, 48 + 26 * (1 - u * 0.5) - 10 * v + 66 * (glow ** 1.65)))
            b = int(min(255, 43 + 22 * (1 - u * 0.5) - 8 * v + 56 * (glow ** 1.65)))
            px[x, y] = (r, g, b, 255)

    d = ImageDraw.Draw(bg)
    d.rounded_rectangle([14, 14, W - 15, H - 15], radius=24, outline=(52, 211, 153, 70), width=2)

    mark_h = 236
    mw, mh = mark_dark.size
    mark_w = int(round(mw * mark_h / mh))
    tx, ty = 78, (H - mark_h) // 2

    halo = Image.new("RGBA", (mark_w + 110, mark_h + 110), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse([24, 24, mark_w + 86, mark_h + 86], fill=(52, 211, 153, 52))
    halo = halo.filter(ImageFilter.GaussianBlur(26))
    bg.alpha_composite(halo, (tx - 55, ty - 55))

    bg.alpha_composite(mark_dark.resize((mark_w, mark_h), Image.LANCZOS), (tx, ty))

    f_stack = load_font(FONT_BOLD, 88)
    f_pharma = load_font(FONT_SEMI, 88)
    f_sub = load_font(FONT_REG, 27)
    f_pill = load_font(FONT_SEMI, 20)

    text_x = tx + mark_w + 54
    ws = d.textlength("Stack", font=f_stack)
    d.text((text_x, 66), "Stack", font=f_stack, fill=(255, 255, 255, 255))
    d.text((text_x + ws, 66), "Pharmacy", font=f_pharma, fill=(110, 231, 183, 255))

    d.text(
        (text_x + 2, 186),
        "Open-Source Cloud Pharmacy POS, AI Bill Scanner & FEFO Expiry Guard",
        font=f_sub,
        fill=(224, 242, 241, 235),
    )

    pills = [
        ("AI Bill Scanner", (13, 120, 106, 230), (255, 255, 255, 255)),
        ("FEFO Expiry Guard", (13, 120, 106, 230), (255, 255, 255, 255)),
        ("PostgreSQL RLS", (13, 120, 106, 230), (255, 255, 255, 255)),
        ("stackpharmacy.in", (52, 211, 153, 245), (5, 31, 32, 255)),
    ]
    cx = text_x
    cy = 248
    for label, bg_c, fg_c in pills:
        tw = d.textlength(label, font=f_pill)
        pw = int(tw + 34)
        d.rounded_rectangle([cx, cy, cx + pw, cy + 42], radius=21, fill=bg_c)
        d.text((cx + 17, cy + 8), label, font=f_pill, fill=fg_c)
        cx += pw + 14

    return bg


def draw_android_splash(mark_dark: Image.Image, w: int, h: int) -> Image.Image:
    canvas = Image.new("RGB", (w, h), (0, 77, 64))
    mark_h = int(round(min(w, h) * 0.32))
    mw, mh = mark_dark.size
    mark_w = int(round(mw * mark_h / mh))
    icon = mark_dark.resize((mark_w, mark_h), Image.LANCZOS)
    canvas.paste(icon, ((w - mark_w) // 2, (h - mark_h) // 2), icon)
    return canvas


def main():
    os.makedirs(BRAND_DIR, exist_ok=True)
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    os.makedirs(DESKTOP_KIT, exist_ok=True)

    # Render canonical Option D SVGs & 4x PNG masters via Chrome
    subprocess.run(["node", os.path.join(ROOT, "scripts", "render-brand-svg.mjs")], check=True)

    mark_light_raw = trim_alpha(Image.open(os.path.join(TMP_SVG_DIR, "mark_light_1024.png")).convert("RGBA"))
    mark_dark_raw = trim_alpha(Image.open(os.path.join(TMP_SVG_DIR, "mark_dark_1024.png")).convert("RGBA"))
    horiz_light_img = Image.open(os.path.join(TMP_SVG_DIR, "horiz_light.png")).convert("RGBA")
    horiz_dark_img = Image.open(os.path.join(TMP_SVG_DIR, "horiz_dark.png")).convert("RGBA")

    # 1. Core brand/ PNGs
    full_1024 = compose_light_tile(mark_light_raw, 1024, fill_ratio=0.72)
    tile_1024 = apply_mask(full_1024, make_squircle_mask(1024, 0.22))
    mark_square_1024 = pad_to_square(mark_light_raw, 1024, fill_ratio=0.86)
    social_1080 = compose_light_tile(mark_light_raw, 1080, fill_ratio=0.70).convert("RGB")

    full_1024.save(os.path.join(BRAND_DIR, "stackpharmacy-icon-1024.png"))
    tile_1024.save(os.path.join(BRAND_DIR, "stackpharmacy-icon-tile-1024.png"))
    mark_square_1024.save(os.path.join(BRAND_DIR, "stackpharmacy-icon-transparent-1024.png"))
    social_1080.save(os.path.join(BRAND_DIR, "stackpharmacy-social-dp.png"), quality=96)

    horiz_light_img.save(os.path.join(BRAND_DIR, "stackpharmacy-logo-horizontal-light.png"))
    horiz_dark_img.save(os.path.join(BRAND_DIR, "stackpharmacy-logo-horizontal-dark.png"))
    draw_vertical_lockup(mark_light_raw, dark_text=True).save(os.path.join(BRAND_DIR, "stackpharmacy-logo-vertical.png"))
    draw_readme_banner(mark_dark_raw).save(os.path.join(BRAND_DIR, "stackpharmacy-readme-banner.png"))

    # 2. Web & PWA Icons + UI/Splash/Ad PNG mark in client/public/
    apply_mask(full_1024, make_squircle_mask(192, 0.22)).save(os.path.join(PUBLIC_DIR, "icon-192.png"))
    apply_mask(full_1024, make_squircle_mask(512, 0.22)).save(os.path.join(PUBLIC_DIR, "icon-512.png"))
    compose_light_tile(mark_light_raw, 512, fill_ratio=0.66).save(os.path.join(PUBLIC_DIR, "icon-maskable-512.png"))
    # High-contrast dark-safe emerald triad mark for logo-mark.png (splash, ad headers, dark cards)
    pad_to_square(mark_dark_raw, 256, fill_ratio=0.86).save(os.path.join(PUBLIC_DIR, "logo-mark.png"))

    # 3. Android native mipmaps & floating splash screens
    mipmap_specs = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432),
    }
    for folder, (ic_sz, fg_sz) in mipmap_specs.items():
        mdir = os.path.join(RES_DIR, folder)
        os.makedirs(mdir, exist_ok=True)
        sq = apply_mask(full_1024, make_squircle_mask(ic_sz, 0.20))
        rd = apply_mask(full_1024, make_circle_mask(ic_sz))
        fg_base = pad_to_square(mark_light_raw, fg_sz, fill_ratio=0.58)
        sq.save(os.path.join(mdir, "ic_launcher.png"))
        rd.save(os.path.join(mdir, "ic_launcher_round.png"))
        fg_base.save(os.path.join(mdir, "ic_launcher_foreground.png"))

    for sp_path in glob.glob(os.path.join(RES_DIR, "drawable*", "splash.png")):
        with Image.open(sp_path) as existing:
            sw, sh = existing.size
        draw_android_splash(mark_dark_raw, sw, sh).save(sp_path)

    # Clean up temporary intermediate SVG raster directory before syncing Desktop kit
    shutil.rmtree(TMP_SVG_DIR, ignore_errors=True)

    # 4. Copy full Option D Brand Kit (SVGs + PNGs) to Desktop
    for fname in os.listdir(DESKTOP_KIT):
        p = os.path.join(DESKTOP_KIT, fname)
        if os.path.isfile(p):
            os.remove(p)
    for fname in os.listdir(BRAND_DIR):
        src = os.path.join(BRAND_DIR, fname)
        if os.path.isfile(src):
            shutil.copy2(src, os.path.join(DESKTOP_KIT, fname))

    print("Option D SVG + PNG Brand kit generated cleanly:")
    print(f"  Repo brand/:    {BRAND_DIR} ({len(os.listdir(BRAND_DIR))} files)")
    print(f"  PWA public/:    {PUBLIC_DIR}")
    print(f"  Desktop export: {DESKTOP_KIT}")


if __name__ == "__main__":
    main()
