"""
Generates 6 crisp 2K (1600x980) Swiss-editorial SaaS cards for Ad #3
(Video 4 style 3D Stacked Card Cascade Reel in Blender 5.2).
Uses Concept 3 transparent 3D Glass Shield + StackPharmacy emerald palette.
"""

import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(BASE_DIR, "textures")
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
LOGO_MARK = os.path.join(ROOT_DIR, "client", "public", "logo-mark.png")
os.makedirs(TEX_DIR, exist_ok=True)

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_SEMI = r"C:\Windows\Fonts\segoeuisb.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"

W, H = 1600, 980


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    for p in (path, FONT_BOLD, FONT_REG):
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def make_gradient(top_rgb, bot_rgb) -> Image.Image:
    im = Image.new("RGBA", (W, H), (*top_rgb, 255))
    d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / max(1, H - 1)
        r = int(top_rgb[0] + (bot_rgb[0] - top_rgb[0]) * t)
        g = int(top_rgb[1] + (bot_rgb[1] - top_rgb[1]) * t)
        b = int(top_rgb[2] + (bot_rgb[2] - top_rgb[2]) * t)
        d.line([(0, y), (W, y)], fill=(r, g, b, 255))
    return im


def apply_subtle_grid(im: Image.Image, rgba=(255, 255, 255, 16), step_x=200, step_y=196) -> Image.Image:
    """Alpha-composite hairline grid lines cleanly so lines stay ultra-subtle."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for x in range(step_x, W, step_x):
        od.line([(x, 0), (x, H)], fill=rgba, width=2)
    for y in range(step_y, H, step_y):
        od.line([(0, y), (W, y)], fill=rgba, width=2)
    return Image.alpha_composite(im, ov)


def draw_check(d: ImageDraw.ImageDraw, cx, cy, sz, color, width=6):
    pts = [
        (cx - sz * 0.42, cy + sz * 0.02),
        (cx - sz * 0.12, cy + sz * 0.36),
        (cx + sz * 0.46, cy - sz * 0.34),
    ]
    d.line(pts, fill=color, width=width, joint="curve")


def card_1_brand_hero():
    """Bold signature emerald-mint hero brand card."""
    im = make_gradient((0, 105, 92), (5, 48, 42))
    im = apply_subtle_grid(im, (255, 255, 255, 16))
    d = ImageDraw.Draw(im)

    d.text((78, 62), "PHARMACY OS  •  INDIA", font=font(FONT_SEMI, 28), fill=(167, 243, 208, 220))
    d.rounded_rectangle([W - 220, 48, W - 74, 102], radius=27, fill=(218, 241, 222, 245))
    d.text((W - 196, 58), "v2.0 AI", font=font(FONT_BOLD, 28), fill=(5, 31, 32, 255))

    if os.path.exists(LOGO_MARK):
        ico = Image.open(LOGO_MARK).convert("RGBA").resize((360, 360), Image.LANCZOS)
        im.alpha_composite(ico, (74, 240))

    d.text((468, 266), "Stack", font=font(FONT_BOLD, 168), fill=(255, 255, 255, 255))
    d.text((468, 444), "Pharmacy", font=font(FONT_BOLD, 168), fill=(128, 203, 196, 255))

    d.line([(78, 790), (W - 78, 790)], fill=(128, 203, 196, 255), width=2)
    d.text((78, 834), "AI BILL SCANNER  •  FEFO EXPIRY GUARD", font=font(FONT_BOLD, 34), fill=(218, 241, 222, 245))
    f_url = font(FONT_BOLD, 34)
    uw = d.textlength("stackpharmacy.in", font=f_url)
    d.text((W - 78 - uw, 834), "stackpharmacy.in", font=f_url, fill=(255, 255, 255, 255))

    p = os.path.join(TEX_DIR, "card_1_brand.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_2_metrics_dark():
    """Matte charcoal analytics & AI scanner metrics card."""
    im = Image.new("RGBA", (W, H), (14, 22, 21, 255))
    im = apply_subtle_grid(im, (255, 255, 255, 11))
    d = ImageDraw.Draw(im)

    d.text((78, 58), "METRICS", font=font(FONT_SEMI, 28), fill=(142, 182, 155, 220))
    d.text((540, 58), "0.8s", font=font(FONT_BOLD, 30), fill=(255, 255, 255, 255))
    d.text((880, 58), "94%", font=font(FONT_BOLD, 30), fill=(255, 255, 255, 255))
    d.text((1240, 58), "0%", font=font(FONT_BOLD, 30), fill=(77, 182, 172, 255))
    d.line([(78, 122), (W - 78, 122)], fill=(45, 75, 70, 255), width=2)

    d.rounded_rectangle([78, 172, 680, 896], radius=32, fill=(22, 42, 39, 255), outline=(45, 212, 191, 140), width=3)
    d.text((124, 220), "AI BILL EXTRACTION", font=font(FONT_BOLD, 30), fill=(77, 182, 172, 255))
    d.text((124, 288), "0.8s", font=font(FONT_BOLD, 174), fill=(255, 255, 255, 255))
    d.text((124, 496), "AVERAGE SCAN TIME", font=font(FONT_SEMI, 30), fill=(180, 212, 206, 230))

    bars = [
        ("PRINTED BILLS", 0.94, (45, 212, 191)),
        ("BATCH & EXPIRY", 0.98, (16, 185, 129)),
        ("STOCK SYNC", 1.00, (218, 241, 222)),
    ]
    by = 595
    for lbl, frac, col in bars:
        d.text((124, by), lbl, font=font(FONT_SEMI, 22), fill=(180, 206, 200, 220))
        d.rounded_rectangle([124, by + 34, 626, by + 56], radius=11, fill=(10, 20, 18, 255))
        d.rounded_rectangle([124, by + 34, 124 + int(502 * frac), by + 56], radius=11, fill=(*col, 255))
        by += 88

    rows = [
        ("CROCIN ADVANCE 500", "25 STRIPS  •  ₹18.40", "EXP 11/27", (45, 212, 191)),
        ("DOLO 650 TABLETS", "50 STRIPS  •  ₹15.50", "EXP 03/28", (45, 212, 191)),
        ("AUGMENTIN 625 DUO", "10 STRIPS  •  ₹162.00", "18D ALERT", (245, 158, 11)),
        ("AZITHRAL 500 MG", "20 STRIPS  •  ₹72.00", "EXP 08/27", (45, 212, 191)),
    ]
    ry = 172
    for name, sub, tag, badge_c in rows:
        d.rounded_rectangle([730, ry, W - 78, ry + 158], radius=24, fill=(22, 34, 32, 255), outline=(55, 80, 75, 255), width=2)
        d.text((774, ry + 32), name, font=font(FONT_BOLD, 34), fill=(255, 255, 255, 255))
        d.text((774, ry + 84), sub, font=font(FONT_REG, 28), fill=(160, 192, 186, 235))
        d.rounded_rectangle([W - 300, ry + 48, W - 110, ry + 106], radius=16, fill=(*badge_c, 255))
        d.text((W - 280, ry + 60), tag, font=font(FONT_BOLD, 26), fill=(10, 20, 18, 255))
        ry += 186

    p = os.path.join(TEX_DIR, "card_2_metrics.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_3_process_white():
    """Crisp editorial off-white process card (contrasts dark cards cleanly)."""
    im = Image.new("RGBA", (W, H), (247, 250, 249, 255))
    im = apply_subtle_grid(im, (5, 31, 32, 14))
    d = ImageDraw.Draw(im)

    d.text((84, 62), "HOW IT WORKS — 3 STEPS", font=font(FONT_BOLD, 30), fill=(0, 105, 92, 255))
    d.line([(84, 120), (W - 84, 120)], fill=(205, 222, 218, 255), width=2)

    steps = [
        ("1", "PHOTO KHICHO", "Snap distributor bill or upload WhatsApp PDF", True),
        ("2", "AI EXTRACTS", "Reads medicines, batch, expiry & GST rate", False),
        ("3", "STOCK READY", "Auto-updates inventory + FEFO billing", False),
    ]
    sy = 168
    for num, title, desc, highlight in steps:
        fill_c = (5, 31, 32, 255) if highlight else (255, 255, 255, 255)
        txt_c = (255, 255, 255, 255) if highlight else (5, 31, 32, 255)
        sub_c = (167, 243, 208, 240) if highlight else (71, 85, 105, 255)
        d.rounded_rectangle([84, sy, 972, sy + 210], radius=28, fill=fill_c, outline=(0, 105, 92, 75), width=3)
        d.rounded_rectangle([120, sy + 52, 216, sy + 158], radius=20, fill=(0, 121, 107, 255))
        d.text((146, sy + 64), num, font=font(FONT_BOLD, 66), fill=(255, 255, 255, 255))
        d.text((254, sy + 46), title, font=font(FONT_BOLD, 54), fill=txt_c)
        d.text((254, sy + 118), desc, font=font(FONT_REG, 28), fill=sub_c)
        sy += 244

    # Right phone-card preview panel (clean width so all labels sit inside box with ample right pad)
    d.rounded_rectangle([1018, 168, W - 78, 876], radius=34, fill=(5, 31, 32, 255))
    d.rounded_rectangle([1050, 202, W - 110, 842], radius=24, fill=(242, 248, 246, 255))
    d.rounded_rectangle([1050, 202, W - 110, 324], radius=24, fill=(0, 77, 64, 255))
    d.rectangle([1050, 290, W - 110, 324], fill=(0, 77, 64, 255))
    d.text((1096, 236), "AI SCANNER LIVE", font=font(FONT_BOLD, 34), fill=(255, 255, 255, 255))
    for i, label in enumerate(["Batch Mapped", "Expiry Verified", "MRP & GST Synced", "Ready for POS"]):
        iy = 368 + i * 100
        d.rounded_rectangle([1084, iy, W - 144, iy + 78], radius=18, fill=(255, 255, 255, 255), outline=(0, 105, 92, 80), width=2)
        d.ellipse([1106, iy + 18, 1148, iy + 60], fill=(0, 121, 107, 255))
        draw_check(d, 1127, iy + 39, 22, (255, 255, 255, 255), width=5)
        d.text((1170, iy + 22), label, font=font(FONT_BOLD, 27), fill=(15, 23, 42, 255))

    p = os.path.join(TEX_DIR, "card_3_process.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_4_expiry_guard():
    """Deep emerald-noir expiry protection card."""
    im = make_gradient((5, 31, 32), (16, 56, 50))
    im = apply_subtle_grid(im, (142, 182, 155, 16))
    d = ImageDraw.Draw(im)

    d.text((84, 58), "EXPIRY GUARD  •  30 / 60 / 90 DAYS", font=font(FONT_BOLD, 28), fill=(142, 182, 155, 235))
    d.text((84, 134), "NO MORE EXPIRED", font=font(FONT_BOLD, 102), fill=(255, 255, 255, 255))
    d.text((84, 248), "MEDICINE LOSS.", font=font(FONT_BOLD, 102), fill=(77, 182, 172, 255))

    alerts = [
        ("CRITICAL • 18 DAYS", "Augmentin 625 Duo — Batch B94", "Return to distributor & save ₹4,800", (220, 38, 38)),
        ("UPCOMING • 45 DAYS", "Pantoprazole 40mg — Batch P22", "Prioritize FEFO shelf counter sale", (245, 158, 11)),
        ("SAFE • 2028 VALID", "All 1,420 active inventory batches", "Real-time cloud + WhatsApp alerts", (16, 185, 129)),
    ]
    ay = 426
    for pill, title, sub, col in alerts:
        d.rounded_rectangle([84, ay, W - 84, ay + 148], radius=24, fill=(11, 43, 38, 240), outline=(*col, 210), width=3)
        d.rounded_rectangle([118, ay + 44, 438, ay + 104], radius=16, fill=(*col, 255))
        f_p = font(FONT_BOLD, 25)
        pw = d.textlength(pill, font=f_p)
        d.text((118 + (320 - pw) / 2, ay + 57), pill, font=f_p, fill=(255, 255, 255, 255))
        d.text((472, ay + 30), title, font=font(FONT_BOLD, 38), fill=(255, 255, 255, 255))
        d.text((472, ay + 84), sub, font=font(FONT_REG, 28), fill=(204, 242, 236, 225))
        ay += 172

    p = os.path.join(TEX_DIR, "card_4_expiry.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_5_whatsapp_khata():
    """Fresh mint-cream high-contrast feature card (#DAF1DE)."""
    im = make_gradient((224, 246, 232), (248, 252, 249))
    im = apply_subtle_grid(im, (5, 31, 32, 14))
    d = ImageDraw.Draw(im)

    d.text((84, 58), "COUNTER POS  •  KHATA  •  MOBILE APP", font=font(FONT_BOLD, 28), fill=(0, 105, 92, 255))
    d.text((84, 154), "BILLING & KHATA", font=font(FONT_BOLD, 118), fill=(5, 31, 32, 255))
    d.text((84, 288), "ON WHATSAPP.", font=font(FONT_BOLD, 118), fill=(0, 121, 107, 255))

    chips = [
        ("1-Tap Digital", "Bills", "Instant PDF invoice link", "directly on WhatsApp"),
        ("Customer", "Udhaari Khata", "Zero-error balance and", "payment reminders"),
        ("FEFO Smart", "Batch Rotation", "Sells earliest-expiry", "batch automatically"),
    ]
    cx = 84
    cw = 456
    for t1, t2, d1, d2 in chips:
        d.rounded_rectangle([cx, 500, cx + cw, 876], radius=30, fill=(255, 255, 255, 255), outline=(0, 105, 92, 85), width=3)
        d.rounded_rectangle([cx + 32, 536, cx + 100, 604], radius=18, fill=(0, 105, 92, 255))
        draw_check(d, cx + 66, 570, 32, (255, 255, 255, 255), width=6)
        d.text((cx + 32, 634), t1, font=font(FONT_BOLD, 38), fill=(5, 31, 32, 255))
        d.text((cx + 32, 682), t2, font=font(FONT_BOLD, 38), fill=(0, 121, 107, 255))
        d.text((cx + 32, 754), d1, font=font(FONT_REG, 26), fill=(71, 85, 105, 255))
        d.text((cx + 32, 790), d2, font=font(FONT_REG, 26), fill=(71, 85, 105, 255))
        cx += cw + 32

    p = os.path.join(TEX_DIR, "card_5_pos.png")
    im.convert("RGB").save(p, quality=96)
    return p


def card_6_cta_offer():
    """Bold emerald offer hero card with giant editorial '1'."""
    im = make_gradient((13, 148, 136), (0, 68, 58))
    im = apply_subtle_grid(im, (255, 255, 255, 16))
    d = ImageDraw.Draw(im)

    d.text((84, 62), "START TODAY  •  NO SETUP FEES", font=font(FONT_BOLD, 30), fill=(218, 241, 222, 240))
    d.text((1040, 20), "1", font=font(FONT_BOLD, 760), fill=(255, 255, 255, 235))

    d.text((84, 184), "FIRST", font=font(FONT_BOLD, 138), fill=(255, 255, 255, 255))
    d.text((84, 332), "MONTH", font=font(FONT_BOLD, 138), fill=(255, 255, 255, 255))
    d.text((84, 480), "FREE.", font=font(FONT_BOLD, 138), fill=(253, 224, 71, 255))

    d.text((84, 654), "Then ₹599/month  •  Cancel Anytime", font=font(FONT_BOLD, 40), fill=(224, 246, 238, 255))

    d.rounded_rectangle([84, 760, 880, 892], radius=34, fill=(5, 31, 32, 255), outline=(218, 241, 222, 230), width=4)
    d.text((138, 796), "Try Free Now  •  stackpharmacy.in", font=font(FONT_BOLD, 42), fill=(255, 255, 255, 255))

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
    print("GENERATED_AD3_CARDS:")
    for p in paths:
        print(" -", p, os.path.getsize(p))


if __name__ == "__main__":
    main()
