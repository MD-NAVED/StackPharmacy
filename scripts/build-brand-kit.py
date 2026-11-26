"""
Builds the unified StackPharmacy Concept 3 (3D Glass Shield) Brand Kit,
Web/PWA icons, transparent UI mark, Android native launcher & splash assets,
GitHub README banner, and Desktop export folder from the approved Concept 3 artwork.

Usage:
    python scripts/build-brand-kit.py [optional_path_to_master_image]
"""

from collections import deque
import glob
import math
import os
import shutil
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT_MASTER = (
    r"C:\Users\andyk\.gemini\antigravity\brain\4140c91b-119c-439f-947f-2c1e61208fca"
    r"\concept_3_guard_3d_glass_fixed_1795680913042.jpg"
)
BRAND_DIR = os.path.join(ROOT, "brand")
PUBLIC_DIR = os.path.join(ROOT, "client", "public")
RES_DIR = os.path.join(ROOT, "client", "android", "app", "src", "main", "res")
DESKTOP_KIT = os.path.join(os.path.expanduser("~"), "Desktop", "StackPharmacy_Brand_Kit")

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


def extract_concept3_transparent(master: Image.Image) -> Image.Image:
    """Isolate the 3D glass plates + shield + cross cleanly with transparent background."""
    im = master.convert("RGBA")
    W, H = im.size
    px = im.load()

    def is_bg_pixel(r: int, g: int, b: int) -> bool:
        # Dark emerald backdrop & soft cast shadow (near-zero Red channel)
        if r <= 12 and g <= 68:
            return True
        if r <= 10 and g <= 115 and (g - b) >= 3:
            return True
        return False

    visited = bytearray(W * H)
    bg = bytearray(W * H)
    q = deque()

    for x in range(W):
        for y in (0, H - 1):
            idx = y * W + x
            if not visited[idx]:
                r, g, b, _ = px[x, y]
                if is_bg_pixel(r, g, b):
                    visited[idx] = 1
                    bg[idx] = 1
                    q.append((x, y))
    for y in range(H):
        for x in (0, W - 1):
            idx = y * W + x
            if not visited[idx]:
                r, g, b, _ = px[x, y]
                if is_bg_pixel(r, g, b):
                    visited[idx] = 1
                    bg[idx] = 1
                    q.append((x, y))

    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < W and 0 <= ny < H:
                nidx = ny * W + nx
                if not visited[nidx]:
                    visited[nidx] = 1
                    r, g, b, _ = px[nx, ny]
                    if is_bg_pixel(r, g, b):
                        bg[nidx] = 1
                        q.append((nx, ny))

    # Keep ONLY the largest connected foreground component (eliminates stray corner/edge noise)
    fg_seen = bytearray(W * H)
    best_comp = []
    for y in range(H):
        row = y * W
        for x in range(W):
            idx = row + x
            if not bg[idx] and not fg_seen[idx]:
                comp = []
                cq = deque([(x, y)])
                fg_seen[idx] = 1
                while cq:
                    px_x, px_y = cq.popleft()
                    comp.append((px_x, px_y))
                    for nx, ny in ((px_x - 1, px_y), (px_x + 1, px_y), (px_x, px_y - 1), (px_x, px_y + 1)):
                        if 0 <= nx < W and 0 <= ny < H:
                            nidx = ny * W + nx
                            if not bg[nidx] and not fg_seen[nidx]:
                                fg_seen[nidx] = 1
                                cq.append((nx, ny))
                if len(comp) > len(best_comp):
                    best_comp = comp

    mask = Image.new("L", (W, H), 0)
    mpx = mask.load()
    for x, y in best_comp:
        mpx[x, y] = 255

    # Clean 1px edge shave + smooth anti-aliased edge feather
    mask = mask.filter(ImageFilter.MinFilter(3))
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))

    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)

    bbox = out.getbbox()
    cropped = out.crop(bbox)
    return cropped


def pad_to_square(img: Image.Image, target_size: int, fill_ratio: float = 0.88) -> Image.Image:
    """Center a transparent graphic cleanly inside a square RGBA canvas."""
    cw, ch = img.size
    max_dim = max(cw, ch)
    scale = (target_size * fill_ratio) / max_dim
    nw, nh = int(round(cw * scale)), int(round(ch * scale))
    resized = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    canvas.paste(resized, ((target_size - nw) // 2, (target_size - nh) // 2), resized)
    return canvas


def crop_center_zoom(img: Image.Image, zoom: float = 1.0) -> Image.Image:
    w, h = img.size
    if zoom <= 1.0:
        return img.copy()
    side = min(w, h) / zoom
    x0 = (w - side) / 2.0
    y0 = (h - side) / 2.0
    return img.crop((x0, y0, x0 + side, y0 + side)).resize((w, h), Image.LANCZOS)


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


def make_radial_fade_mask(size: int, inner: float = 0.62, outer: float = 0.96) -> Image.Image:
    mask = Image.new("L", (size, size), 255)
    px = mask.load()
    c = (size - 1) / 2.0
    r_in = c * inner
    r_out = c * outer
    span = max(1e-6, r_out - r_in)
    for y in range(size):
        dy = y - c
        for x in range(size):
            dist = math.hypot(x - c, dy)
            if dist <= r_in:
                a = 255
            elif dist >= r_out:
                a = 0
            else:
                t = (dist - r_in) / span
                s = t * t * (3.0 - 2.0 * t)
                a = int(round(255 * (1.0 - s)))
            px[x, y] = a
    return mask


def apply_mask(img: Image.Image, size: int, mask: Image.Image, zoom: float = 1.0) -> Image.Image:
    base = crop_center_zoom(img, zoom).resize((size, size), Image.LANCZOS).convert("RGBA")
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    return out


def draw_wordmark_lockup(mark_transparent: Image.Image, dark_text: bool = True) -> Image.Image:
    """Horizontal lockup with transparent floating 3D Glass Shield mark + StackPharmacy."""
    W, H = 2048, 560
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)

    mark_h = 430
    mw, mh = mark_transparent.size
    mark_w = int(round(mw * mark_h / mh))
    tx, ty = 74, (H - mark_h) // 2

    mark_resized = mark_transparent.resize((mark_w, mark_h), Image.LANCZOS)
    canvas.alpha_composite(mark_resized, (tx, ty))

    f_word = load_font(FONT_BOLD, 178)
    f_tag = load_font(FONT_SEMI, 42)

    c_stack = (11, 38, 34, 255) if dark_text else (255, 255, 255, 255)
    c_pharma = (0, 105, 92, 255) if dark_text else (128, 203, 196, 255)
    c_tag = (55, 92, 86, 235) if dark_text else (204, 242, 236, 235)

    text_x = tx + mark_w + 58
    word_y = 148
    w_stack = d.textlength("Stack", font=f_word)
    d.text((text_x, word_y), "Stack", font=f_word, fill=c_stack)
    d.text((text_x + w_stack, word_y), "Pharmacy", font=f_word, fill=c_pharma)
    d.text((text_x + 4, 358), "SMART STOCK & EXPIRY GUARD FOR CHEMISTS", font=f_tag, fill=c_tag)

    return canvas


def draw_vertical_lockup(mark_transparent: Image.Image, dark_text: bool = True) -> Image.Image:
    """Stacked vertical lockup with transparent floating 3D Glass Shield mark."""
    W, H = 1400, 1120
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)

    mark_h = 480
    mw, mh = mark_transparent.size
    mark_w = int(round(mw * mark_h / mh))
    tx, ty = (W - mark_w) // 2, 95

    canvas.alpha_composite(mark_transparent.resize((mark_w, mark_h), Image.LANCZOS), (tx, ty))

    f_word = load_font(FONT_BOLD, 148)
    f_tag = load_font(FONT_SEMI, 40)

    c_stack = (11, 38, 34, 255) if dark_text else (255, 255, 255, 255)
    c_pharma = (0, 105, 92, 255) if dark_text else (128, 203, 196, 255)
    c_tag = (55, 92, 86, 235) if dark_text else (204, 242, 236, 235)

    ws = d.textlength("Stack", font=f_word)
    wp = d.textlength("Pharmacy", font=f_word)
    wx = (W - (ws + wp)) / 2.0
    wy = 626
    d.text((wx, wy), "Stack", font=f_word, fill=c_stack)
    d.text((wx + ws, wy), "Pharmacy", font=f_word, fill=c_pharma)

    tag = "SMART STOCK & EXPIRY GUARD"
    wt = d.textlength(tag, font=f_tag)
    d.text(((W - wt) / 2.0, 822), tag, font=f_tag, fill=c_tag)

    return canvas


def draw_readme_banner(mark_transparent: Image.Image) -> Image.Image:
    """Sleek 1280x360 hero banner with floating 3D Glass Shield (NO outer box)."""
    W, H = 1280, 360
    bg = Image.new("RGBA", (W, H), (0, 56, 46, 255))
    px = bg.load()
    for y in range(H):
        for x in range(W):
            u = x / W
            v = y / H
            glow = max(0.0, 1.0 - math.hypot((x - 195) / 340.0, (y - 180) / 220.0))
            r = int(min(255, 0 + 18 * u + 26 * (glow ** 1.65)))
            g = int(min(255, 62 + 30 * (1 - u * 0.5) - 14 * v + 78 * (glow ** 1.65)))
            b = int(min(255, 53 + 24 * (1 - u * 0.5) - 10 * v + 64 * (glow ** 1.65)))
            px[x, y] = (r, g, b, 255)

    d = ImageDraw.Draw(bg)
    d.rounded_rectangle([14, 14, W - 15, H - 15], radius=24, outline=(77, 182, 172, 75), width=2)

    # Floating isolated 3D Glass Shield mark directly over subtle mint studio halo
    mark_h = 252
    mw, mh = mark_transparent.size
    mark_w = int(round(mw * mark_h / mh))
    tx, ty = 78, (H - mark_h) // 2

    halo = Image.new("RGBA", (mark_w + 120, mark_h + 120), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse([24, 24, mark_w + 96, mark_h + 96], fill=(77, 182, 172, 72))
    halo = halo.filter(ImageFilter.GaussianBlur(28))
    bg.alpha_composite(halo, (tx - 60, ty - 60))

    bg.alpha_composite(mark_transparent.resize((mark_w, mark_h), Image.LANCZOS), (tx, ty))

    f_title = load_font(FONT_BOLD, 88)
    f_sub = load_font(FONT_REG, 28)
    f_pill = load_font(FONT_SEMI, 20)

    text_x = tx + mark_w + 54
    ws = d.textlength("Stack", font=f_title)
    d.text((text_x, 66), "Stack", font=f_title, fill=(255, 255, 255, 255))
    d.text((text_x + ws, 66), "Pharmacy", font=f_title, fill=(128, 203, 196, 255))

    d.text(
        (text_x + 2, 186),
        "Open-Source Cloud Pharmacy POS, AI Bill Scanner & FEFO Expiry Guard",
        font=f_sub,
        fill=(224, 242, 241, 235),
    )

    pills = [
        ("AI Bill Scanner", (0, 121, 107, 230), (255, 255, 255, 255)),
        ("FEFO Expiry Guard", (0, 121, 107, 230), (255, 255, 255, 255)),
        ("PostgreSQL RLS", (0, 121, 107, 230), (255, 255, 255, 255)),
        ("stackpharmacy.in", (77, 182, 172, 245), (0, 42, 36, 255)),
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


def draw_android_splash(mark_transparent: Image.Image, w: int, h: int) -> Image.Image:
    """Create crisp RGB splash screen with floating 3D Glass Shield on #004D40."""
    canvas = Image.new("RGB", (w, h), (0, 77, 64))
    mark_h = int(round(min(w, h) * 0.36))
    mw, mh = mark_transparent.size
    mark_w = int(round(mw * mark_h / mh))
    icon = mark_transparent.resize((mark_w, mark_h), Image.LANCZOS)
    x = (w - mark_w) // 2
    y = (h - mark_h) // 2
    canvas.paste(icon, (x, y), icon)
    return canvas


def main():
    src_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_MASTER
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Master concept image not found: {src_path}")

    os.makedirs(BRAND_DIR, exist_ok=True)
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    os.makedirs(DESKTOP_KIT, exist_ok=True)

    master = Image.open(src_path).convert("RGBA")
    mark_cropped = extract_concept3_transparent(master)
    mark_square_1024 = pad_to_square(mark_cropped, 1024, fill_ratio=0.90)

    # 1. Core 1024 brand assets
    full_1024 = crop_center_zoom(master, zoom=1.12).resize((1024, 1024), Image.LANCZOS)
    tile_1024 = apply_mask(master, 1024, make_squircle_mask(1024, 0.22), zoom=1.15)
    social_1080 = crop_center_zoom(master, zoom=1.08).resize((1080, 1080), Image.LANCZOS).convert("RGB")

    full_1024.save(os.path.join(BRAND_DIR, "stackpharmacy-icon-1024.png"))
    tile_1024.save(os.path.join(BRAND_DIR, "stackpharmacy-icon-tile-1024.png"))
    mark_square_1024.save(os.path.join(BRAND_DIR, "stackpharmacy-icon-transparent-1024.png"))
    social_1080.save(os.path.join(BRAND_DIR, "stackpharmacy-social-dp.png"), quality=96)

    # 2. Floating-mark Wordmark lockups + README hero banner (zero dark squircle box!)
    lockup_light = draw_wordmark_lockup(mark_cropped, dark_text=True)
    lockup_dark = draw_wordmark_lockup(mark_cropped, dark_text=False)
    lockup_vertical = draw_vertical_lockup(mark_cropped, dark_text=True)
    readme_banner = draw_readme_banner(mark_cropped)

    lockup_light.save(os.path.join(BRAND_DIR, "stackpharmacy-logo-horizontal-light.png"))
    lockup_dark.save(os.path.join(BRAND_DIR, "stackpharmacy-logo-horizontal-dark.png"))
    lockup_vertical.save(os.path.join(BRAND_DIR, "stackpharmacy-logo-vertical.png"))
    readme_banner.save(os.path.join(BRAND_DIR, "stackpharmacy-readme-banner.png"))

    # 3. Web & PWA Icons + transparent UI mark in client/public/
    icon_192 = apply_mask(master, 192, make_squircle_mask(192, 0.22), zoom=1.15)
    icon_512 = apply_mask(master, 512, make_squircle_mask(512, 0.22), zoom=1.15)
    icon_maskable = crop_center_zoom(master, zoom=1.0).resize((512, 512), Image.LANCZOS).convert("RGBA")
    ui_mark_256 = pad_to_square(mark_cropped, 256, fill_ratio=0.92)

    icon_192.save(os.path.join(PUBLIC_DIR, "icon-192.png"))
    icon_512.save(os.path.join(PUBLIC_DIR, "icon-512.png"))
    icon_maskable.save(os.path.join(PUBLIC_DIR, "icon-maskable-512.png"))
    ui_mark_256.save(os.path.join(PUBLIC_DIR, "logo-mark.png"))

    # 4. Android native mipmaps & floating splash screens
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
        sq = apply_mask(master, ic_sz, make_squircle_mask(ic_sz, 0.20), zoom=1.15)
        rd = apply_mask(master, ic_sz, make_circle_mask(ic_sz), zoom=1.08)
        fg_base = Image.new("RGBA", (fg_sz, fg_sz), (0, 77, 64, 0))
        inner_sz = int(round(fg_sz * 0.72))
        inner_img = apply_mask(master, inner_sz, make_radial_fade_mask(inner_sz, 0.56, 0.96), zoom=1.12)
        off = (fg_sz - inner_sz) // 2
        fg_base.paste(inner_img, (off, off), inner_img)

        sq.save(os.path.join(mdir, "ic_launcher.png"))
        rd.save(os.path.join(mdir, "ic_launcher_round.png"))
        fg_base.save(os.path.join(mdir, "ic_launcher_foreground.png"))

    for sp_path in glob.glob(os.path.join(RES_DIR, "drawable*", "splash.png")):
        with Image.open(sp_path) as existing:
            sw, sh = existing.size
        splash = draw_android_splash(mark_cropped, sw, sh)
        splash.save(sp_path)

    # 5. Copy full brand kit to Desktop for immediate social/PR use
    for fname in os.listdir(BRAND_DIR):
        shutil.copy2(os.path.join(BRAND_DIR, fname), os.path.join(DESKTOP_KIT, fname))

    print("Transparent Brand kit generated successfully:")
    print(f"  Repo brand/:    {BRAND_DIR} ({len(os.listdir(BRAND_DIR))} files)")
    print(f"  PWA public/:    {PUBLIC_DIR} (icon-192, icon-512, icon-maskable-512, logo-mark)")
    print(f"  Android res/:   {RES_DIR} (5 mipmap densities + floating splash screens)")
    print(f"  Desktop export: {DESKTOP_KIT}")


if __name__ == "__main__":
    main()
