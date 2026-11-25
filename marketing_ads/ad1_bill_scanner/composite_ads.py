"""
Composites agency-grade marketing headlines, pricing offers, and CTAs onto the
Cycles 3D renders (`raw_poster.png`, `raw_banner.png`) and creates transparent
overlay graphics (`reels_overlay.png`) for the animated 9:16 Reels video ad.
"""
import os
from PIL import Image, ImageDraw, ImageFont

DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(DIR, "outputs")
TEX_DIR = os.path.join(DIR, "textures")
ICON_PATH = os.path.abspath(os.path.join(DIR, "..", "client", "public", "icon-512.png"))

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def draw_checkmark(draw, cx, cy, size, color, width=4):
    pts = [
        (cx - size * 0.42, cy + size * 0.04),
        (cx - size * 0.10, cy + size * 0.36),
        (cx + size * 0.46, cy - size * 0.34),
    ]
    draw.line(pts, fill=color, width=width, joint="curve")


def draw_vertical_gradient(W, H, top_rgba, bot_rgba):
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(grad)
    for y in range(H):
        t = y / max(1, H - 1)
        r = int(top_rgba[0] + (bot_rgba[0] - top_rgba[0]) * t)
        g = int(top_rgba[1] + (bot_rgba[1] - top_rgba[1]) * t)
        b = int(top_rgba[2] + (bot_rgba[2] - top_rgba[2]) * t)
        a = int(top_rgba[3] + (bot_rgba[3] - top_rgba[3]) * t)
        if a > 0:
            d.line([(0, y), (W, y)], fill=(r, g, b, a))
    return grad


def centered_text(draw, y, text, fnt, fill, W, shadow=True):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    if shadow:
        draw.text((x + 2, y + 3), text, font=fnt, fill=(0, 12, 10, 180))
    draw.text((x, y), text, font=fnt, fill=fill)
    return bbox[3] - bbox[1]


def build_feed_poster():
    raw_path = os.path.join(OUT_DIR, "raw_poster.png")
    base = Image.open(raw_path).convert("RGBA")
    W, H = base.size  # 1080 x 1350

    # Subtle dark top vignette + bottom vignette for effortless text legibility
    top_v = draw_vertical_gradient(W, 430, (2, 22, 19, 235), (2, 22, 19, 0))
    base.alpha_composite(top_v, (0, 0))
    bot_v = draw_vertical_gradient(W, 330, (2, 18, 15, 0), (2, 18, 15, 245))
    base.alpha_composite(bot_v, (0, H - 330))

    d = ImageDraw.Draw(base)

    # Top Eyebrow Pill
    pill_w, pill_h = 460, 44
    px = (W - pill_w) // 2
    d.rounded_rectangle([px, 34, px + pill_w, 34 + pill_h], radius=22,
                        fill=(10, 62, 54, 230), outline=(45, 212, 191, 220), width=2)
    centered_text(d, 41, "AI CHEMIST COUNTER SOFTWARE", font(FONT_BOLD, 22), (167, 243, 208, 255), W, shadow=False)

    # Punchy Main Headline
    centered_text(d, 92, "Bill Photo Khicho.", font(FONT_BOLD, 74), (255, 255, 255, 255), W)
    centered_text(d, 174, "Stock Auto-Ready!", font(FONT_BOLD, 74), (45, 212, 191, 255), W)
    centered_text(d, 266, "Manual typing bandh  •  Expiry loss ZERO", font(FONT_REG, 30), (209, 250, 229, 245), W)

    # Bottom Offer Card + CTA Strip
    card_x0, card_y0, card_x1, card_y1 = 56, H - 208, W - 56, H - 44
    d.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=28,
                        fill=(4, 34, 29, 238), outline=(45, 212, 191, 160), width=2)

    # Gold "1ST MONTH FREE" pill inside left of bottom card
    d.rounded_rectangle([84, card_y0 + 24, 386, card_y0 + 74], radius=14, fill=(245, 158, 11, 255))
    d.text((112, card_y0 + 31), "1ST MONTH FREE", font=font(FONT_BOLD, 28), fill=(15, 23, 42, 255))

    d.text((86, card_y0 + 88), "Then ₹599/mo  •  Cancel Anytime", font=font(FONT_BOLD, 28), fill=(241, 245, 249, 255))

    # Right Emerald CTA Button
    btn_x0, btn_y0, btn_x1, btn_y1 = W - 418, card_y0 + 32, W - 82, card_y1 - 32
    d.rounded_rectangle([btn_x0, btn_y0, btn_x1, btn_y1], radius=22,
                        fill=(13, 148, 136, 255), outline=(94, 234, 212, 255), width=2)
    d.text((btn_x0 + 36, btn_y0 + 16), "Start Free Trial", font=font(FONT_BOLD, 32), fill=(255, 255, 255, 255))
    d.text((btn_x0 + 48, btn_y0 + 58), "stackpharmacy.in", font=font(FONT_BOLD, 24), fill=(204, 251, 241, 255))

    out = os.path.join(OUT_DIR, "StackPharmacy_Ad_Feed_1080x1350.png")
    base.convert("RGB").save(out, quality=96)
    return out


def build_wide_banner():
    raw_path = os.path.join(OUT_DIR, "raw_banner.png")
    base = Image.open(raw_path).convert("RGBA")
    W, H = base.size  # 1920 x 1080

    # Left horizontal gradient so left copy pops crisply over dark emerald backdrop
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for x in range(1020):
        t = x / 1019.0
        a = int(240 * (1.0 - t ** 1.4))
        od.line([(x, 0), (x, H)], fill=(2, 20, 17, a))
    base.alpha_composite(overlay)

    d = ImageDraw.Draw(base)
    lx = 72

    # Top Logo Lockup
    if os.path.exists(ICON_PATH):
        ico = Image.open(ICON_PATH).convert("RGBA").resize((76, 76), Image.LANCZOS)
        base.alpha_composite(ico, (lx, 84))
    d.text((lx + 96, 86), "StackPharmacy", font=font(FONT_BOLD, 44), fill=(255, 255, 255, 255))
    d.text((lx + 96, 138), "Smart Chemist POS & Expiry Guard", font=font(FONT_REG, 24), fill=(153, 246, 228, 255))

    # Bold Hero Headline
    d.text((lx, 230), "Medical Store", font=font(FONT_BOLD, 82), fill=(255, 255, 255, 255))
    d.text((lx, 320), "Chalana Ab", font=font(FONT_BOLD, 82), fill=(255, 255, 255, 255))
    d.text((lx, 410), "10x Aasaan.", font=font(FONT_BOLD, 88), fill=(45, 212, 191, 255))

    # 3 Clean Feature Bullets (compact width so zero overlap with 3D bottle)
    bullets = [
        "Bill photo se AI stock update",
        "90-day expiry & low-stock alerts",
        "Customer Khata & WhatsApp Bills",
    ]
    by = 556
    for b in bullets:
        d.ellipse([lx, by + 6, lx + 32, by + 38], fill=(13, 148, 136, 255))
        draw_checkmark(d, lx + 16, by + 22, 18, (255, 255, 255, 255), width=4)
        d.text((lx + 48, by), b, font=font(FONT_BOLD, 29), fill=(226, 232, 240, 255))
        by += 58

    # Bottom Offer & CTA
    d.rounded_rectangle([lx, 774, lx + 290, 824], radius=14, fill=(245, 158, 11, 255))
    d.text((lx + 24, 781), "1ST MONTH FREE", font=font(FONT_BOLD, 25), fill=(15, 23, 42, 255))
    d.text((lx + 308, 781), "Then ₹599/mo", font=font(FONT_BOLD, 26), fill=(204, 251, 241, 255))

    d.rounded_rectangle([lx, 858, lx + 560, 954], radius=24, fill=(13, 148, 136, 255), outline=(94, 234, 212, 255), width=3)
    d.text((lx + 36, 882), "Start Free Trial  •  stackpharmacy.in", font=font(FONT_BOLD, 30), fill=(255, 255, 255, 255))

    out = os.path.join(OUT_DIR, "StackPharmacy_Ad_Banner_1920x1080.png")
    base.convert("RGB").save(out, quality=96)
    return out


def build_reels_layers():
    """Creates 6 transparent 1080x1920 kinetic overlay layers for staggered pop-up Reels animation."""
    W, H = 1080, 1920

    # Layer 1 (t=0.2s): Top gradient + Brand Logo + Line 1 Hook ("Bill Photo Khicho.")
    l1 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    l1.alpha_composite(draw_vertical_gradient(W, 560, (2, 20, 17, 235), (2, 20, 17, 0)), (0, 0))
    d1 = ImageDraw.Draw(l1)
    if os.path.exists(ICON_PATH):
        ico = Image.open(ICON_PATH).convert("RGBA").resize((68, 68), Image.LANCZOS)
        l1.alpha_composite(ico, (315, 108))
    d1.text((402, 112), "StackPharmacy", font=font(FONT_BOLD, 48), fill=(255, 255, 255, 255))
    centered_text(d1, 206, "Bill Photo Khicho.", font(FONT_BOLD, 78), (255, 255, 255, 255), W)
    p_l1 = os.path.join(TEX_DIR, "reels_layer_1_brand.png")
    l1.save(p_l1)

    # Layer 2 (t=2.0s): "Stock Auto-Ready!" + Subtitle
    l2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(l2)
    centered_text(d2, 292, "Stock Auto-Ready!", font(FONT_BOLD, 78), (45, 212, 191, 255), W)
    centered_text(d2, 390, "AI Scan in 0.8s  •  No Manual Typing", font(FONT_BOLD, 31), (209, 250, 229, 255), W)
    p_l2 = os.path.join(TEX_DIR, "reels_layer_2_sub.png")
    l2.save(p_l2)

    # Helper for floating glass feature pills (t=4.2s, 5.1s, 6.0s) in clean mid-upper zone (y=460..545)
    def make_pill_layer(filename, x0, y0, w, text, accent_rgb=(45, 212, 191)):
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        h = 62
        d.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=31,
                            fill=(4, 34, 29, 238), outline=(*accent_rgb, 240), width=3)
        d.ellipse([x0 + 16, y0 + 14, x0 + 50, y0 + 48], fill=(*accent_rgb, 255))
        draw_checkmark(d, x0 + 33, y0 + 31, 18, (4, 34, 29, 255), width=4)
        d.text((x0 + 64, y0 + 13), text, font=font(FONT_BOLD, 28), fill=(248, 250, 252, 255))
        outp = os.path.join(TEX_DIR, filename)
        img.save(outp)
        return outp

    p_l3 = make_pill_layer("reels_layer_3_pill1.png", 70, 468, 435, "0% Manual Typing", (45, 212, 191))
    p_l4 = make_pill_layer("reels_layer_4_pill2.png", 555, 468, 455, "Expiry Loss = ZERO", (245, 158, 11))
    p_l5 = make_pill_layer("reels_layer_5_pill3.png", 295, 548, 490, "1-Tap WhatsApp Bills", (52, 211, 153))

    # Layer 6 (t=6.8s): Bottom gradient + Offer & Trial CTA Card
    l6 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    l6.alpha_composite(draw_vertical_gradient(W, 420, (2, 18, 15, 0), (2, 18, 15, 244)), (0, H - 420))
    d6 = ImageDraw.Draw(l6)
    card_y0, card_y1 = 1535, 1780
    d6.rounded_rectangle([64, card_y0, W - 64, card_y1], radius=32,
                         fill=(4, 34, 29, 244), outline=(45, 212, 191, 220), width=3)
    d6.rounded_rectangle([100, card_y0 + 26, 420, card_y0 + 78], radius=14, fill=(245, 158, 11, 255))
    d6.text((130, card_y0 + 34), "1ST MONTH FREE", font=font(FONT_BOLD, 28), fill=(15, 23, 42, 255))
    d6.text((448, card_y0 + 34), "Then ₹599/month", font=font(FONT_BOLD, 32), fill=(241, 245, 249, 255))
    d6.rounded_rectangle([100, card_y0 + 106, W - 100, card_y1 - 26], radius=24,
                         fill=(13, 148, 136, 255), outline=(94, 234, 212, 255), width=2)
    centered_text(d6, card_y0 + 132, "Try Free Now  •  stackpharmacy.in", font(FONT_BOLD, 38), (255, 255, 255, 255), W, shadow=False)
    p_l6 = os.path.join(TEX_DIR, "reels_layer_6_cta.png")
    l6.save(p_l6)

    return [p_l1, p_l2, p_l3, p_l4, p_l5, p_l6]


if __name__ == "__main__":
    p1 = build_feed_poster()
    p2 = build_wide_banner()
    layers = build_reels_layers()
    print("Composited marketing creatives:")
    for p in [p1, p2, *layers]:
        print(" -", p)
