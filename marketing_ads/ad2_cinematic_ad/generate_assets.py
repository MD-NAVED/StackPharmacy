"""Generate 2K textures, authentic StackPharmacy Dashboard PNG, Lockup Logo PNG,
muted pharma box wraps, distributor bills, and calculator face for Ad #2.
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(BASE_DIR, "textures")
os.makedirs(TEX_DIR, exist_ok=True)

ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
ICON_PATH = os.path.join(ROOT_DIR, "client", "public", "logo-mark.png")
ICON_LIGHT_PATH = os.path.join(ROOT_DIR, "brand", "stackpharmacy-icon-transparent-1024.png")

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_MONO = r"C:\Windows\Fonts\consolab.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.truetype(FONT_BOLD, size)


def draw_rupee(draw: ImageDraw.ImageDraw, x: float, y: float, size: float, color, width: int = 4):
    """Draw a crisp vector Indian Rupee symbol (safe from missing font glyphs)."""
    h = size
    w = size * 0.58
    draw.line([(x, y + h * 0.14), (x + w, y + h * 0.14)], fill=color, width=width)
    draw.line([(x, y + h * 0.36), (x + w, y + h * 0.36)], fill=color, width=width)
    draw.arc([x - w * 0.18, y + h * 0.12, x + w * 0.72, y + h * 0.60], start=275, end=90, fill=color, width=width)
    draw.line([(x + w * 0.06, y + h * 0.54), (x + w * 0.64, y + h * 0.94)], fill=color, width=width)


def build_dashboard_png() -> str:
    """Create 1080x2280 dashboard.png modeled directly after Dashboard.jsx + theme.js."""
    W, H = 1080, 2280
    img = Image.new("RGB", (W, H), (241, 245, 244))  # #f1f5f4
    d = ImageDraw.Draw(img)

    # Status bar + Top AppBar (#00695c -> #004d40)
    d.rectangle([0, 0, W, 220], fill=(0, 77, 64))
    d.text((54, 34), "9:41", font=font(FONT_BOLD, 34), fill=(215, 245, 238))
    d.rounded_rectangle([W - 148, 42, W - 56, 72], radius=8, outline=(215, 245, 238), width=3)
    d.rounded_rectangle([W - 142, 48, W - 74, 66], radius=4, fill=(100, 255, 218))

    if os.path.exists(ICON_PATH):
        icon = Image.open(ICON_PATH).convert("RGBA").resize((84, 84), Image.LANCZOS)
        img.paste(icon, (52, 108), icon)

    d.text((156, 114), "StackPharmacy", font=font(FONT_BOLD, 46), fill=(255, 255, 255))
    d.text((158, 168), "Shree Ganesh Medicals • Live Stock", font=font(FONT_REG, 24), fill=(178, 223, 219))

    # Dashboard header + WhatsApp Summary CTA (#25D366)
    d.text((52, 260), "Dashboard", font=font(FONT_BOLD, 50), fill=(22, 36, 33))
    d.rounded_rectangle([W - 430, 254, W - 48, 334], radius=18, fill=(37, 211, 102))
    d.ellipse([W - 402, 272, W - 360, 314], outline=(255, 255, 255), width=4)
    d.text((W - 344, 274), "WhatsApp Summary", font=font(FONT_BOLD, 30), fill=(255, 255, 255))

    # 2x2 KPI Cards from Dashboard.jsx (Today's Sales, Profit, Low Stock, Expiring <= 90d)
    cards = [
        (52, 372, (0, 105, 92), "Today's Sales", "28,450", "+18% today", True),
        (556, 372, (46, 125, 50), "Today's Profit", "7,180", "25.2% margin", True),
        (52, 650, (237, 108, 2), "Low Stock Items", "6", "View alerts >", False),
        (556, 650, (211, 47, 47), "Expiring <= 90 Days", "4", "Save loss now >", False),
    ]
    cw, ch = 472, 248
    for x, y, col, title, val, sub, has_rupee in cards:
        d.rounded_rectangle([x, y, x + cw, y + ch], radius=24, fill=(255, 255, 255), outline=(224, 230, 228), width=2)
        d.rounded_rectangle([x + 28, y + 26, x + 98, y + 96], radius=16, fill=col)
        # Clean icon glyph inside badge
        bx, by = x + 63, y + 61
        if has_rupee:
            draw_rupee(d, bx - 14, by - 22, 42, (255, 255, 255), width=4)
        else:
            d.polygon([(bx, by - 22), (bx - 22, by + 18), (bx + 22, by + 18)], outline=(255, 255, 255), width=4)
            d.line([(bx, by - 8), (bx, by + 6)], fill=(255, 255, 255), width=4)

        d.text((x + 118, y + 40), title, font=font(FONT_BOLD, 28), fill=(85, 102, 98))
        vx = x + 32
        if has_rupee:
            draw_rupee(d, vx, y + 118, 56, (18, 28, 26), width=5)
            vx += 42
        d.text((vx, y + 114), val, font=font(FONT_BOLD, 60), fill=(18, 28, 26))
        d.text((x + 32, y + 194), sub, font=font(FONT_BOLD, 25), fill=col)

    # Sales - Last 7 Days BarChart card
    cy = 934
    d.rounded_rectangle([52, cy, W - 52, cy + 540], radius=24, fill=(255, 255, 255), outline=(224, 230, 228), width=2)
    d.text((84, cy + 28), "Sales — Last 7 Days", font=font(FONT_BOLD, 36), fill=(24, 38, 35))
    d.rounded_rectangle([W - 322, cy + 26, W - 82, cy + 74], radius=14, fill=(224, 242, 241))
    d.text((W - 302, cy + 36), "Revenue UP +24%", font=font(FONT_BOLD, 22), fill=(0, 105, 92))

    # Chart axes + crisp teal bars
    chart_l, chart_r, chart_t, chart_b = 148, W - 96, cy + 120, cy + 455
    for frac in (0.0, 0.33, 0.66, 1.0):
        gy = int(chart_b - frac * (chart_b - chart_t))
        d.line([(chart_l, gy), (chart_r, gy)], fill=(230, 236, 234), width=2)
        lbl = f"{int(frac * 30)}k"
        d.text((78, gy - 14), lbl, font=font(FONT_REG, 22), fill=(120, 138, 134))

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    vals = [0.58, 0.72, 0.64, 0.85, 0.79, 0.90, 0.96]
    slot_w = (chart_r - chart_l) / len(days)
    bar_w = 64
    for i, (day, v) in enumerate(zip(days, vals)):
        bx0 = int(chart_l + i * slot_w + (slot_w - bar_w) * 0.5)
        by0 = int(chart_b - v * (chart_b - chart_t))
        fill_col = (0, 137, 123) if i < 6 else (0, 105, 92)
        d.rounded_rectangle([bx0, by0, bx0 + bar_w, chart_b], radius=10, fill=fill_col)
        d.text((bx0 + 10, chart_b + 14), day, font=font(FONT_BOLD, 24), fill=(95, 110, 106))

    # Top Sellers + Needs Attention panel
    ty = 1508
    d.rounded_rectangle([52, ty, W - 52, 2190], radius=24, fill=(255, 255, 255), outline=(224, 230, 228), width=2)
    d.text((84, ty + 28), "Top Sellers & Expiry Guard", font=font(FONT_BOLD, 34), fill=(24, 38, 35))

    rows = [
        ("1", "Dolo 650 mg Strip (15 Tabs)", "Micro Labs Ltd • 48 strips sold", "1,632"),
        ("2", "Augmentin 625 Duo Tabs", "GSK Pharma • 26 strips sold", "5,798"),
        ("3", "Azithral 500 Tablet", "Alembic • 31 strips sold", "3,689"),
    ]
    ry = ty + 96
    for idx_str, med, comp, price in rows:
        d.ellipse([84, ry + 10, 134, ry + 60], fill=(0, 105, 92))
        d.text((100, ry + 18), idx_str, font=font(FONT_BOLD, 28), fill=(255, 255, 255))
        d.text((156, ry + 4), med, font=font(FONT_BOLD, 28), fill=(22, 34, 31))
        d.text((156, ry + 42), comp, font=font(FONT_REG, 22), fill=(110, 126, 122))
        draw_rupee(d, W - 210, ry + 16, 30, (0, 105, 92), width=3)
        d.text((W - 182, ry + 12), price, font=font(FONT_BOLD, 30), fill=(0, 105, 92))
        d.line([(84, ry + 86), (W - 84, ry + 86)], fill=(238, 242, 240), width=2)
        ry += 102

    # Alert Banner at bottom
    ay = ry + 16
    d.rounded_rectangle([84, ay, W - 84, ay + 124], radius=18, fill=(254, 242, 242), outline=(239, 154, 154), width=3)
    d.rounded_rectangle([104, ay + 24, 178, ay + 98], radius=14, fill=(211, 47, 47))
    d.text((130, ay + 34), "!", font=font(FONT_BOLD, 46), fill=(255, 255, 255))
    d.text((198, ay + 22), "Expiring Soon: Augmentin Batch B94", font=font(FONT_BOLD, 28), fill=(183, 28, 28))
    d.text((198, ay + 64), "18 days left • Return / Discount to save Rs. 4,800", font=font(FONT_REG, 23), fill=(140, 45, 45))

    # Action pill footer
    d.rounded_rectangle([84, ay + 148, W - 84, ay + 222], radius=18, fill=(0, 105, 92))
    d.text((290, ay + 166), "Scan Next Bill -> +0.8s Sync", font=font(FONT_BOLD, 32), fill=(255, 255, 255))

    out = os.path.join(TEX_DIR, "dashboard.png")
    img.save(out)
    return out


def build_logo_pngs() -> tuple[str, str]:
    """Create crisp transparent lockup logo PNG + vertical lockup PNG for Scene 4."""
    # Horizontal lockup for 1920x1080 & square-friendly center scaling
    W, H = 2048, 768
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    sting_icon_path = ICON_LIGHT_PATH if os.path.exists(ICON_LIGHT_PATH) else ICON_PATH
    if os.path.exists(sting_icon_path):
        icon = Image.open(sting_icon_path).convert("RGBA").resize((320, 320), Image.LANCZOS)
        img.paste(icon, (130, 210), icon)

    # Unified charcoal #212121 wordmark matching official web & brand kit
    f_word = font(FONT_BOLD, 168)
    d.text((495, 224), "StackPharmacy", font=f_word, fill=(33, 33, 33, 255))

    d.text(
        (505, 424),
        "SMART STOCK & EXPIRY GUARD FOR CHEMISTS",
        font=font(FONT_BOLD, 40),
        fill=(100, 116, 139, 240),
    )
    out_h = os.path.join(TEX_DIR, "logo_stackpharmacy.png")
    img.save(out_h)

    # Stacked vertical lockup for clean 9:16 mobile sting
    VW, VH = 1400, 1200
    vimg = Image.new("RGBA", (VW, VH), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vimg)
    if os.path.exists(sting_icon_path):
        vicon = Image.open(sting_icon_path).convert("RGBA").resize((360, 360), Image.LANCZOS)
        vimg.paste(vicon, ((VW - 360) // 2, 120), vicon)

    fv = font(FONT_BOLD, 134)
    w_all = vd.textlength("StackPharmacy", font=fv)
    sx = (VW - w_all) / 2
    vd.text((sx, 535), "StackPharmacy", font=fv, fill=(33, 33, 33, 255))
    tag = "SMART STOCK & EXPIRY GUARD"
    wt = vd.textlength(tag, font=font(FONT_BOLD, 42))
    vd.text(((VW - wt) / 2, 710), tag, font=font(FONT_BOLD, 42), fill=(100, 116, 139, 240))

    out_v = os.path.join(TEX_DIR, "logo_stackpharmacy_vertical.png")
    vimg.save(out_v)
    return out_h, out_v


def build_shelf_boxes() -> list[str]:
    """Generate muted medicine box textures + expiry warning texture for Scene 1."""
    specs = [
        ("shelf_box_01.png", (76, 86, 94), (105, 118, 126), "CEFIXIME 200", "10 x 10 TABS", False),
        ("shelf_box_02.png", (98, 94, 86), (132, 126, 115), "PANTOPRAZOLE", "40 MG TABLETS", False),
        ("shelf_box_03.png", (68, 88, 86), (92, 122, 118), "AZITHRAL 500", "5 TABS IP", False),
        ("shelf_box_04.png", (86, 82, 92), (118, 112, 128), "METFORMIN SR", "500 MG STRIP", False),
        ("shelf_box_05.png", (92, 96, 88), (124, 130, 118), "TELMA-H 40", "15 TABS BLISTER", False),
        ("shelf_box_expiry_hero.png", (62, 66, 72), (185, 42, 42), "AUGMENTIN 625", "EXPIRING ALERT", True),
    ]
    paths = []
    for fname, base, accent, title, sub, is_hero in specs:
        W, H = 1024, 512
        img = Image.new("RGB", (W, H), base)
        d = ImageDraw.Draw(img)
        d.rectangle([0, 0, W, 110], fill=accent)
        d.rectangle([38, 146, W - 38, H - 40], fill=(212, 214, 210) if not is_hero else (232, 224, 222))
        d.text((54, 26), title, font=font(FONT_BOLD, 54), fill=(238, 240, 238))
        d.text((58, 178), sub, font=font(FONT_BOLD, 44), fill=(48, 52, 54))
        d.text((58, 250), "Batch B9402  •  Schedule H Drug", font=font(FONT_REG, 30), fill=(85, 88, 90))
        if is_hero:
            d.rounded_rectangle([58, 326, 520, 412], radius=14, fill=(198, 40, 40))
            d.text((88, 344), "EXPIRY: THIS WEEK", font=font(FONT_BOLD, 38), fill=(255, 245, 245))
        else:
            d.rectangle([58, 332, 420, 396], fill=(168, 172, 170))
        p = os.path.join(TEX_DIR, fname)
        img.save(p)
        paths.append(p)
    return paths


def build_bills_and_calculator() -> list[str]:
    """Generate 3 distinct messy paper GST distributor bills + calculator LCD texture."""
    bills = [
        ("distributor_bill_1.png", "SHREE BALAJI PHARMA DIST.", "INV-4821", "18,450.00", [
            ("Dolo-650 Tabs", "25", "750.00"),
            ("Augmentin 625", "18", "3,618.00"),
            ("Pantocid DSR", "30", "4,140.00"),
            ("Corex DX Syr", "24", "2,880.00"),
            ("Shelcal-500", "40", "4,520.00"),
        ]),
        ("distributor_bill_2.png", "MAHAVIR MEDICO AGENCIES", "MH-9034", "24,180.50", [
            ("Azithral 500", "40", "4,760.00"),
            ("Montair LC", "32", "6,240.00"),
            ("Telma 40 Tabs", "50", "5,900.00"),
            ("Ecosprin 75", "80", "1,440.00"),
            ("Pan-D Cap", "45", "5,840.50"),
        ]),
        ("distributor_bill_3.png", "LAXMI HEALTHCARE WHOLESALE", "LX-1178", "12,640.00", [
            ("Ciprofloxacin", "20", "1,980.00"),
            ("Ascoril LS", "30", "3,360.00"),
            ("Glycomet GP2", "35", "4,130.00"),
            ("Becosules Z", "60", "3,170.00"),
        ]),
    ]
    out_paths = []
    for fname, vendor, inv_no, total, items in bills:
        W, H = 900, 1280
        img = Image.new("RGB", (W, H), (242, 236, 224))  # warm aged paper
        d = ImageDraw.Draw(img)
        d.rectangle([28, 28, W - 28, H - 28], outline=(110, 108, 104), width=3)
        d.rectangle([28, 28, W - 28, 170], fill=(226, 218, 202))
        d.text((54, 48), "TAX INVOICE - PHARMACEUTICALS", font=font(FONT_BOLD, 26), fill=(90, 50, 40))
        d.text((54, 88), vendor, font=font(FONT_BOLD, 38), fill=(28, 32, 36))
        d.text((54, 194), f"Bill No: {inv_no}    Date: 24/11/26    GSTIN: 27AABCU9603R", font=font(FONT_MONO, 22), fill=(55, 58, 62))
        d.line([(48, 240), (W - 48, 240)], fill=(90, 90, 90), width=3)
        d.text((54, 256), "ITEM DESCRIPTION              QTY        AMOUNT", font=font(FONT_MONO, 24), fill=(40, 40, 42))
        d.line([(48, 298), (W - 48, 298)], fill=(120, 120, 120), width=2)

        y = 326
        for name, qty, amt in items:
            d.text((54, y), name, font=font(FONT_MONO, 26), fill=(35, 38, 42))
            d.text((520, y), qty, font=font(FONT_MONO, 26), fill=(35, 38, 42))
            d.text((665, y), amt, font=font(FONT_MONO, 26), fill=(35, 38, 42))
            d.line([(48, y + 48), (W - 48, y + 48)], fill=(205, 198, 186), width=1)
            y += 72

        # Fake handwritten red pen highlight / urgent circle on total
        d.line([(48, 980), (W - 48, 980)], fill=(60, 60, 60), width=3)
        d.text((54, 1015), "NET PAYABLE (INR):", font=font(FONT_BOLD, 34), fill=(30, 32, 34))
        d.text((560, 1012), f"Rs. {total}", font=font(FONT_MONO, 38), fill=(180, 28, 28))
        d.ellipse([540, 996, 845, 1068], outline=(200, 32, 32), width=5)

        # Bottom barcode bars
        x = 70
        for i in range(44):
            bw = 4 + (i * 5) % 9
            d.rectangle([x, 1140, x + bw, 1215], fill=(45, 45, 45))
            x += bw + 6

        p = os.path.join(TEX_DIR, fname)
        img.save(p)
        out_paths.append(p)

    # Retro chemist desk calculator face
    CW, CH = 800, 1120
    cimg = Image.new("RGB", (CW, CH), (46, 52, 56))
    cd = ImageDraw.Draw(cimg)
    cd.rounded_rectangle([24, 24, CW - 24, CH - 24], radius=36, fill=(56, 62, 68), outline=(88, 96, 102), width=4)
    # Green-grey LCD readout
    cd.rounded_rectangle([64, 68, CW - 64, 260], radius=16, fill=(138, 158, 126), outline=(28, 32, 30), width=6)
    cd.text((195, 118), "18,450.00", font=font(FONT_MONO, 88), fill=(26, 36, 24))
    cd.text((88, 86), "GT  M+", font=font(FONT_BOLD, 24), fill=(36, 48, 34))

    keys = [
        ["MC", "MR", "M-", "M+"],
        ["7", "8", "9", "/"],
        ["4", "5", "6", "*"],
        ["1", "2", "3", "-"],
        ["C", "0", "=", "+"],
    ]
    kw, kh = 148, 122
    gx, gy = 30, 26
    for r, row in enumerate(keys):
        for c, label in enumerate(row):
            kx = 68 + c * (kw + gx)
            ky = 326 + r * (kh + gy)
            kcol = (182, 72, 42) if label == "C" else ((0, 118, 102) if label == "=" else (84, 92, 98))
            cd.rounded_rectangle([kx, ky, kx + kw, ky + kh], radius=16, fill=kcol, outline=(32, 36, 38), width=3)
            cd.text((kx + (44 if len(label) == 1 else 28), ky + 32), label, font=font(FONT_BOLD, 50), fill=(242, 244, 245))

    cp = os.path.join(TEX_DIR, "calculator_face.png")
    cimg.save(cp)
    out_paths.append(cp)
    return out_paths


def main():
    d_path = build_dashboard_png()
    lh, lv = build_logo_pngs()
    s_paths = build_shelf_boxes()
    b_paths = build_bills_and_calculator()
    print("GENERATED_ASSETS:")
    for p in [d_path, lh, lv, *s_paths, *b_paths]:
        print(" ", os.path.basename(p), os.path.getsize(p))


if __name__ == "__main__":
    main()
