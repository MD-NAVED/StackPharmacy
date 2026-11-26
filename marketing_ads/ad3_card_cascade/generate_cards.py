"""
Generates 6 minimalist Swiss-editorial 2K (1600x980) cards for Ad #3
(Video 4 style 3D Stacked Card Cascade Reel in Blender 5.2).
Focus: high negative space, 1px hairline rules, Swiss 721 typography,
zero bulky nested boxes, and 0.5-second scannability.
"""

import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(BASE_DIR, "textures")
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
LOGO_MARK = os.path.join(ROOT_DIR, "client", "public", "logo-mark.png")
os.makedirs(TEX_DIR, exist_ok=True)

SWISS_LIGHT = r"C:\Windows\Fonts\swissl.ttf"
SWISS_REG = r"C:\Windows\Fonts\swiss.ttf"
SWISS_BOLD = r"C:\Windows\Fonts\swissb.ttf"
SEGOE_REG = r"C:\Windows\Fonts\segoeui.ttf"
SEGOE_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
MONO = r"C:\Windows\Fonts\consola.ttf"

W, H = 1600, 980


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    for p in (path, SWISS_REG, SEGOE_REG):
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def make_soft_gradient(top_rgb, bot_rgb) -> Image.Image:
    im = Image.new("RGBA", (W, H), (*top_rgb, 255))
    d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / max(1, H - 1)
        r = int(top_rgb[0] + (bot_rgb[0] - top_rgb[0]) * t)
        g = int(top_rgb[1] + (bot_rgb[1] - top_rgb[1]) * t)
        b = int(top_rgb[2] + (bot_rgb[2] - top_rgb[2]) * t)
        d.line([(0, y), (W, y)], fill=(r, g, b, 255))
    return im


def draw_header(d: ImageDraw.ImageDraw, index_str: str, label: str, right_label: str, ink, muted, line_rgba):
    f_idx = font(MONO, 24)
    f_lbl = font(SWISS_REG, 24)
    d.text((88, 62), index_str, font=f_idx, fill=muted)
    d.text((146, 60), label, font=f_lbl, fill=ink)
    if right_label:
        rw = d.textlength(right_label, font=f_lbl)
        d.text((W - 88 - rw, 60), right_label, font=f_lbl, fill=muted)
    d.line([(88, 114), (W - 88, 114)], fill=line_rgba, width=1)


def draw_text_with_rupee(d: ImageDraw.ImageDraw, xy, text: str, main_font, size: int, fill, bold_rupee=False):
    """Draw Swiss 721 text cleanly while falling back to Segoe UI strictly for '₹' glyphs."""
    if "₹" not in text:
        d.text(xy, text, font=main_font, fill=fill)
        return
    f_rupee = font(SEGOE_BOLD if bold_rupee else SEGOE_REG, size)
    x, y = xy
    for part in text.partition("₹"):
        if not part:
            continue
        f_use = f_rupee if part == "₹" else main_font
        d.text((x, y - (4 if part == "₹" else 0)), part, font=f_use, fill=fill)
        x += d.textlength(part, font=f_use)


def card_1_brand_hero():
    """Minimalist deep forest emerald hero card."""
    im = make_soft_gradient((6, 48, 42), (3, 25, 22))
    d = ImageDraw.Draw(im)

    draw_header(d, "01", "PHARMACY OS", "INDIA", (218, 241, 222, 235), (142, 182, 155, 190), (255, 255, 255, 36))

    if os.path.exists(LOGO_MARK):
        ico = Image.open(LOGO_MARK).convert("RGBA").resize((280, 280), Image.LANCZOS)
        im.alpha_composite(ico, (88, 295))

    d.text((406, 298), "Stack", font=font(SWISS_BOLD, 162), fill=(255, 255, 255, 255))
    d.text((406, 470), "Pharmacy", font=font(SWISS_LIGHT, 162), fill=(159, 227, 214, 245))

    d.line([(88, 820), (W - 88, 820)], fill=(255, 255, 255, 34), width=1)
    d.text((88, 856), "AI BILL SCANNER   ·   EXPIRY GUARD", font=font(SWISS_REG, 24), fill=(142, 182, 155, 215))
    f_url = font(SWISS_REG, 24)
    uw = d.textlength("stackpharmacy.in", font=f_url)
    d.text((W - 88 - uw, 856), "stackpharmacy.in", font=f_url, fill=(255, 255, 255, 230))

    p = os.path.join(TEX_DIR, "card_1_brand.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_2_metrics_dark():
    """Matte obsidian Swiss tabular metrics card (zero nested boxes)."""
    im = make_soft_gradient((16, 19, 19), (10, 12, 12))
    d = ImageDraw.Draw(im)

    # Top clean Swiss tabular header
    f_idx = font(MONO, 24)
    f_lbl = font(SWISS_REG, 24)
    f_num = font(SWISS_BOLD, 28)
    f_sub = font(SWISS_REG, 20)

    d.text((88, 62), "02", font=f_idx, fill=(142, 182, 155, 210))
    d.text((146, 60), "METRICS", font=f_lbl, fill=(255, 255, 255, 235))

    cols = [(640, "0.8s", "SCAN"), (970, "99%", "ACCURACY"), (1290, "0%", "WASTE")]
    for cx, val, cap in cols:
        d.text((cx, 54), val, font=f_num, fill=(255, 255, 255, 255))
        d.text((cx, 90), cap, font=f_sub, fill=(140, 160, 156, 200))
    d.line([(88, 134), (W - 88, 134)], fill=(255, 255, 255, 32), width=1)

    # Lower-left big hero metric (pure typography, zero box)
    d.text((88, 430), "BILL EXTRACTION SPEED", font=font(SWISS_REG, 24), fill=(116, 207, 190, 220))
    d.text((84, 480), "0.8s", font=font(SWISS_LIGHT, 230), fill=(255, 255, 255, 255))
    d.text((88, 765), "Per multi-line distributor invoice", font=font(SWISS_LIGHT, 30), fill=(168, 182, 179, 215))

    # Lower-right ultra-thin hairline bars
    bars = [
        ("OCR PARSE", "96%", 0.96, (94, 216, 198)),
        ("FEFO SYNC", "99%", 0.99, (16, 185, 129)),
        ("GST AUDIT", "100%", 1.00, (218, 241, 222)),
    ]
    bx0, bx1 = 870, W - 88
    by = 465
    f_bar = font(SWISS_REG, 24)
    f_pct = font(MONO, 24)
    for lbl, pct, frac, col in bars:
        d.text((bx0, by), lbl, font=f_bar, fill=(225, 235, 232, 230))
        pw = d.textlength(pct, font=f_pct)
        d.text((bx1 - pw, by), pct, font=f_pct, fill=(142, 182, 155, 220))
        d.line([(bx0, by + 54), (bx1, by + 54)], fill=(255, 255, 255, 35), width=2)
        d.line([(bx0, by + 54), (bx0 + int((bx1 - bx0) * frac), by + 54)], fill=(*col, 255), width=5)
        by += 118

    p = os.path.join(TEX_DIR, "card_2_metrics.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_3_process_white():
    """Pure architectural off-white stepped typography card."""
    im = make_soft_gradient((246, 248, 247), (239, 243, 241))
    d = ImageDraw.Draw(im)

    draw_header(d, "03", "WORKFLOW", "3 STEPS", (12, 26, 24, 255), (102, 126, 120, 255), (5, 31, 32, 34))

    rows = [
        ("01", "SCAN BILL", (8, 20, 18, 255), (0, 121, 107, 255)),
        ("02", "TRACK EXPIRY", (66, 90, 84, 255), (110, 134, 128, 255)),
        ("03", "BILL & KHATA", (124, 145, 140, 255), (146, 165, 160, 255)),
    ]
    ry = 225
    f_n = font(MONO, 30)
    f_t = font(SWISS_LIGHT, 104)
    for num, word, ink, num_c in rows:
        d.text((88, ry + 32), num, font=f_n, fill=num_c)
        d.text((196, ry), word, font=f_t, fill=ink)
        d.line([(88, ry + 156), (W - 88, ry + 156)], fill=(5, 31, 32, 28), width=1)
        ry += 224

    p = os.path.join(TEX_DIR, "card_3_process.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_4_expiry_guard():
    """Minimalist charcoal-forest shift & FEFO protection card."""
    im = make_soft_gradient((9, 28, 25), (5, 18, 16))
    d = ImageDraw.Draw(im)

    draw_header(d, "04", "EXPIRY GUARD", "FEFO AUTOMATION", (220, 242, 234, 235), (142, 182, 155, 205), (255, 255, 255, 32))

    # Clean typographic contrast table on left, airy right stat
    rows = [
        ("BEFORE", "Manual Expiry Loss", (142, 166, 160, 210)),
        ("SYSTEM", "30 / 60 / 90d Alerts", (116, 207, 190, 255)),
        ("AFTER", "Zero Dead Stock", (255, 255, 255, 255)),
    ]
    ry = 248
    f_k = font(MONO, 24)
    f_v = font(SWISS_LIGHT, 62)
    for k, v, vc in rows:
        d.text((88, ry + 20), k, font=f_k, fill=(142, 182, 155, 195))
        d.text((290, ry), v, font=f_v, fill=vc)
        d.line([(88, ry + 122), (960, ry + 122)], fill=(255, 255, 255, 28), width=1)
        ry += 196

    # Minimal subtle stat anchor on right (hairline accent, no boxy chrome)
    d.line([(1060, 248), (1060, 760)], fill=(255, 255, 255, 28), width=1)
    d.ellipse([1126, 294, 1144, 312], fill=(52, 211, 153, 255))
    d.text((1162, 288), "ACTIVE MONITOR", font=font(MONO, 22), fill=(167, 243, 208, 225))
    d.text((1122, 368), "90d", font=font(SWISS_LIGHT, 178), fill=(255, 255, 255, 255))
    d.text((1126, 590), "Early Distributor", font=font(SWISS_REG, 32), fill=(176, 206, 200, 220))
    d.text((1126, 634), "Return Window", font=font(SWISS_REG, 32), fill=(176, 206, 200, 220))

    p = os.path.join(TEX_DIR, "card_4_expiry.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_5_whatsapp_khata():
    """Soft sage-mint editorial typography card with crisp contrast against light studio."""
    im = make_soft_gradient((206, 232, 216), (222, 241, 229))
    d = ImageDraw.Draw(im)

    draw_header(d, "05", "COUNTER & KHATA", "WHATSAPP NATIVE", (5, 31, 32, 245), (56, 98, 88, 220), (5, 31, 32, 32))

    d.text((88, 258), "Digital Bills", font=font(SWISS_BOLD, 128), fill=(5, 31, 32, 255))
    d.text((88, 404), "& Customer Khata.", font=font(SWISS_LIGHT, 128), fill=(0, 110, 96, 255))
    d.text((88, 596), "One-tap WhatsApp invoice  ·  Zero manual register", font=font(SWISS_REG, 34), fill=(54, 82, 75, 230))

    d.line([(88, 820), (W - 88, 820)], fill=(5, 31, 32, 34), width=1)
    d.text((88, 856), "POS   ·   GST BILLING   ·   UDHAARI REMINDERS", font=font(MONO, 24), fill=(32, 74, 65, 210))

    p = os.path.join(TEX_DIR, "card_5_pos.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_6_cta_offer():
    """Minimalist signature emerald CTA card with edge-bleeding giant '1'."""
    im = make_soft_gradient((12, 138, 121), (6, 82, 72))
    d = ImageDraw.Draw(im)

    draw_header(d, "06", "EARLY ACCESS", "NO SETUP FEES", (255, 255, 255, 235), (218, 241, 222, 200), (255, 255, 255, 42))

    # Giant Swiss architectural '1' bleeding softly on right like Noteform red '4'
    d.text((1000, -10), "1", font=font(SWISS_BOLD, 880), fill=(255, 255, 255, 242))

    d.text((88, 396), "First Month", font=font(SWISS_BOLD, 124), fill=(255, 255, 255, 255))
    d.text((88, 536), "Free.", font=font(SWISS_LIGHT, 124), fill=(218, 241, 222, 255))

    d.line([(88, 720), (660, 720)], fill=(255, 255, 255, 72), width=1)
    draw_text_with_rupee(
        d, (88, 758),
        "Then ₹599/mo  ·  stackpharmacy.in",
        font(SWISS_REG, 36), 36, (238, 250, 244, 245), bold_rupee=False
    )

    p = os.path.join(TEX_DIR, "card_6_offer.png")
    im.convert("RGB").save(p, quality=96)
    return p


def main():
    paths = [
        card_1_brand_hero(),
        card_2_metrics_dark(),
        card_3_process_white(),
        card_4_expiry_guard(),
        card_5_whatsapp_khata(),
        card_6_cta_offer(),
    ]
    print("GENERATED_AD3_MINIMAL_CARDS:")
    for p in paths:
        print(" -", p, os.path.getsize(p))


if __name__ == "__main__":
    main()
