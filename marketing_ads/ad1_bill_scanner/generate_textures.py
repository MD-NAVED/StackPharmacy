"""
Generates 2K UI, Invoice Paper, Pharma Packaging, and Marketing Overlay textures
for StackPharmacy 3D Blender Marketing Ads.
All badges use clean vector primitives (no missing Unicode glyph boxes).
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), "textures")
os.makedirs(OUT_DIR, exist_ok=True)

ICON_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "client", "public", "icon-512.png")
)

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_LIGHT = r"C:\Windows\Fonts\segoeuisl.ttf"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.truetype(FONT_BOLD, size)


def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_checkmark(draw, cx, cy, size, color, width=5):
    """Draw a crisp vector checkmark centered roughly at (cx, cy)."""
    pts = [
        (cx - size * 0.45, cy + size * 0.02),
        (cx - size * 0.12, cy + size * 0.36),
        (cx + size * 0.48, cy - size * 0.34),
    ]
    draw.line(pts, fill=color, width=width, joint="curve")


def draw_star(draw, cx, cy, r_outer, color):
    """Draw a crisp 5-point star centered at (cx, cy)."""
    r_inner = r_outer * 0.44
    pts = []
    for i in range(10):
        ang = math.radians(-90 + i * 36)
        r = r_outer if i % 2 == 0 else r_inner
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    draw.polygon(pts, fill=color)


def build_phone_screen():
    W, H = 1080, 2280
    img = Image.new("RGB", (W, H), (244, 248, 247))
    d = ImageDraw.Draw(img)

    # Top deep emerald header bar
    d.rectangle([0, 0, W, 326], fill=(0, 77, 64))
    d.rectangle([0, 314, W, 328], fill=(45, 212, 191))

    # Status bar
    d.text((64, 40), "9:41", font=font(FONT_BOLD, 34), fill=(255, 255, 255))
    d.text((830, 40), "5G   100%", font=font(FONT_BOLD, 32), fill=(204, 251, 241))

    # Brand icon + title
    if os.path.exists(ICON_PATH):
        ico = Image.open(ICON_PATH).convert("RGBA").resize((112, 112), Image.LANCZOS)
        img.paste(ico, (56, 134), ico)

    d.text((194, 134), "StackPharmacy", font=font(FONT_BOLD, 56), fill=(255, 255, 255))
    d.text((194, 206), "AI Bill Scanner  •  Live Stock Sync", font=font(FONT_REG, 32), fill=(153, 246, 228))

    # Green Verified AI Banner
    rounded_rect(d, [48, 366, W - 48, 498], 28, fill=(224, 247, 244), outline=(15, 118, 110), width=3)
    d.ellipse([78, 402, 138, 462], fill=(15, 118, 110))
    draw_checkmark(d, 108, 432, 32, (255, 255, 255), width=6)
    d.text((166, 392), "AI Scan Complete — 0.8s", font=font(FONT_BOLD, 38), fill=(0, 77, 64))
    d.text((166, 444), "3 Medicines • Batches & Expiries Matched", font=font(FONT_REG, 28), fill=(17, 94, 89))

    # Supplier & Total Strip
    rounded_rect(d, [48, 532, W - 48, 728], 28, fill=(255, 255, 255), outline=(218, 228, 225), width=3)
    d.text((82, 558), "SUPPLIER", font=font(FONT_BOLD, 24), fill=(100, 116, 139))
    d.text((82, 594), "Shree Balaji Distributors", font=font(FONT_BOLD, 38), fill=(15, 23, 42))
    d.text((82, 650), "Bill #SB-2417  •  Today", font=font(FONT_REG, 28), fill=(71, 85, 105))

    rounded_rect(d, [695, 578, W - 76, 684], 22, fill=(240, 253, 250), outline=(13, 148, 136), width=3)
    d.text((730, 590), "BILL TOTAL", font=font(FONT_BOLD, 22), fill=(13, 148, 136))
    d.text((730, 622), "₹2,675", font=font(FONT_BOLD, 44), fill=(0, 77, 64))

    # Extracted Item Cards
    items = [
        {
            "name": "Crocin Advance 500mg",
            "meta": "Batch: CAB241   |   Exp: 11/2027",
            "qty": "25 Strips  @  ₹18.40",
            "amt": "₹460",
            "badge": "READY TO STOCK",
            "badge_bg": (220, 252, 231),
            "badge_fg": (21, 128, 61),
            "icon": "check",
        },
        {
            "name": "Dolo 650 Tab (Strip of 15)",
            "meta": "Batch: DPA238   |   Exp: 03/2028",
            "qty": "50 Strips  @  ₹15.50",
            "amt": "₹775",
            "badge": "READY TO STOCK",
            "badge_bg": (220, 252, 231),
            "badge_fg": (21, 128, 61),
            "icon": "check",
        },
        {
            "name": "Azithral 500 Tab (5s)",
            "meta": "Batch: AZT251   |   Exp: 08/2027",
            "qty": "20 Strips  @  ₹72.00",
            "amt": "₹1,440",
            "badge": "EXPIRY TRACKED",
            "badge_bg": (254, 243, 199),
            "badge_fg": (180, 83, 9),
            "icon": "star",
        },
    ]

    y = 770
    for it in items:
        rounded_rect(d, [48, y, W - 48, y + 320], 30, fill=(255, 255, 255), outline=(210, 226, 222), width=3)
        rounded_rect(d, [48, y + 28, 64, y + 292], 8, fill=(0, 105, 92))
        d.text((92, y + 32), it["name"], font=font(FONT_BOLD, 42), fill=(15, 23, 42))
        d.text((92, y + 96), it["meta"], font=font(FONT_BOLD, 30), fill=(15, 118, 110))
        d.text((92, y + 152), it["qty"], font=font(FONT_REG, 30), fill=(71, 85, 105))
        d.text((800, y + 36), it["amt"], font=font(FONT_BOLD, 48), fill=(0, 77, 64))

        pill_w = 390 if it["icon"] == "check" else 380
        rounded_rect(d, [92, y + 220, 92 + pill_w, y + 282], 18, fill=it["badge_bg"])
        if it["icon"] == "check":
            draw_checkmark(d, 126, y + 251, 22, it["badge_fg"], width=5)
        else:
            draw_star(d, 126, y + 251, 13, it["badge_fg"])
        d.text((154, y + 231), it["badge"], font=font(FONT_BOLD, 27), fill=it["badge_fg"])
        y += 354

    # Bottom Sticky Save & Update Stock CTA Button
    rounded_rect(d, [48, 1940, W - 48, 2110], 34, fill=(0, 105, 92))
    draw_checkmark(d, 134, 2025, 32, (167, 243, 208), width=7)
    d.text((186, 1995), "SAVE & UPDATE STOCK (3/3)", font=font(FONT_BOLD, 44), fill=(255, 255, 255))

    rounded_rect(d, [380, 2215, 700, 2232], 8, fill=(148, 163, 184))

    out = os.path.join(OUT_DIR, "phone_screen_scanner.png")
    img.save(out)
    return out


def build_phone_scanning_state():
    """Creates the 'live AI reading bill' phone UI state shown during the laser sweep."""
    W, H = 1080, 2280
    img = Image.new("RGB", (W, H), (8, 28, 24))
    d = ImageDraw.Draw(img)

    # Top bar
    d.rectangle([0, 0, W, 326], fill=(0, 77, 64))
    d.rectangle([0, 314, W, 328], fill=(45, 212, 191))
    d.text((64, 40), "9:41", font=font(FONT_BOLD, 34), fill=(255, 255, 255))
    d.text((830, 40), "5G   100%", font=font(FONT_BOLD, 32), fill=(204, 251, 241))

    if os.path.exists(ICON_PATH):
        ico = Image.open(ICON_PATH).convert("RGBA").resize((112, 112), Image.LANCZOS)
        img.paste(ico, (56, 134), ico)
    d.text((194, 134), "StackPharmacy", font=font(FONT_BOLD, 56), fill=(255, 255, 255))
    d.text((194, 206), "AI Camera  •  Capturing Bill", font=font(FONT_REG, 32), fill=(153, 246, 228))

    # Viewfinder card showing mini thermal bill preview inside scanner reticle
    rounded_rect(d, [76, 400, W - 76, 1740], 36, fill=(14, 44, 38), outline=(45, 212, 191), width=4)

    bill_path = os.path.join(OUT_DIR, "distributor_bill_paper.png")
    if os.path.exists(bill_path):
        bill = Image.open(bill_path).convert("RGB").resize((760, 1060), Image.LANCZOS)
        img.paste(bill, (160, 490))

    # Glowing emerald scanner reticle corners + scan bar across viewfinder
    d.rectangle([140, 960, W - 140, 976], fill=(45, 212, 191))
    rounded_rect(d, [220, 1615, W - 220, 1700], 24, fill=(0, 105, 92), outline=(94, 234, 212), width=3)
    d.text((286, 1634), "AI Reading Medicines...", font=font(FONT_BOLD, 40), fill=(255, 255, 255))

    # Bottom status pill
    rounded_rect(d, [80, 1940, W - 80, 2100], 34, fill=(17, 68, 58), outline=(45, 212, 191), width=3)
    d.text((210, 1994), "DETECTING BATCH & EXPIRY...", font=font(FONT_BOLD, 40), fill=(167, 243, 208))

    rounded_rect(d, [380, 2215, 700, 2232], 8, fill=(148, 163, 184))

    out = os.path.join(OUT_DIR, "phone_screen_scanning.png")
    img.save(out)
    return out


def build_invoice_paper():
    W, H = 960, 1340
    img = Image.new("RGB", (W, H), (252, 251, 246))
    d = ImageDraw.Draw(img)

    d.rectangle([20, 20, W - 20, H - 20], outline=(215, 212, 200), width=3)
    d.text((110, 62), "SHREE BALAJI MEDICAL DISTRIBUTORS", font=font(FONT_BOLD, 38), fill=(20, 24, 30))
    d.text((220, 116), "Wholesale Pharma Supplier  •  Mumbai", font=font(FONT_REG, 28), fill=(70, 78, 90))
    d.text((275, 158), "GSTIN: 27AABCS1429P1Z5", font=font(FONT_BOLD, 26), fill=(70, 78, 90))

    d.line([60, 212, W - 60, 212], fill=(50, 50, 50), width=4)
    d.text((340, 232), "TAX INVOICE", font=font(FONT_BOLD, 40), fill=(15, 23, 42))
    d.line([60, 294, W - 60, 294], fill=(50, 50, 50), width=4)

    d.text((64, 322), "Bill No: SB-2417", font=font(FONT_BOLD, 30), fill=(30, 35, 45))
    d.text((600, 322), "Date: 25/11/2026", font=font(FONT_REG, 30), fill=(30, 35, 45))
    d.text((64, 368), "To: StackPharmacy Demo Medical Store", font=font(FONT_REG, 28), fill=(55, 65, 81))

    d.line([60, 425, W - 60, 425], fill=(120, 120, 120), width=2)
    d.text((64, 444), "ITEM DESCRIPTION", font=font(FONT_BOLD, 28), fill=(15, 23, 42))
    d.text((610, 444), "QTY", font=font(FONT_BOLD, 28), fill=(15, 23, 42))
    d.text((760, 444), "AMT", font=font(FONT_BOLD, 28), fill=(15, 23, 42))
    d.line([60, 492, W - 60, 492], fill=(120, 120, 120), width=2)

    rows = [
        ("1. CROCIN ADVANCE TAB 500MG", "BATCH: CAB241   EXP: 11/2027", "25", "460.00"),
        ("2. DOLO 650 TAB STRIP OF 15", "BATCH: DPA238   EXP: 03/2028", "50", "775.00"),
        ("3. AZITHRAL 500 TAB STRIP 5", "BATCH: AZT251   EXP: 08/2027", "20", "1440.00"),
    ]
    y = 524
    for title, sub, qty, amt in rows:
        d.text((64, y), title, font=font(FONT_BOLD, 30), fill=(20, 25, 35))
        d.text((615, y), qty, font=font(FONT_BOLD, 30), fill=(20, 25, 35))
        d.text((740, y), amt, font=font(FONT_BOLD, 30), fill=(20, 25, 35))
        d.text((92, y + 44), sub, font=font(FONT_REG, 26), fill=(90, 95, 110))
        y += 128

    d.line([60, 930, W - 60, 930], fill=(120, 120, 120), width=2)
    d.text((64, 960), "TAXABLE VALUE:", font=font(FONT_BOLD, 30), fill=(40, 45, 55))
    d.text((670, 960), "Rs. 2675.00", font=font(FONT_BOLD, 30), fill=(40, 45, 55))
    d.text((64, 1006), "CGST + SGST (12%):", font=font(FONT_REG, 28), fill=(70, 75, 85))
    d.text((670, 1006), "Rs. 321.00", font=font(FONT_REG, 28), fill=(70, 75, 85))

    d.line([60, 1068, W - 60, 1068], fill=(30, 30, 30), width=4)
    d.text((64, 1094), "GRAND TOTAL:", font=font(FONT_BOLD, 40), fill=(15, 23, 42))
    d.text((620, 1094), "Rs. 2996.00", font=font(FONT_BOLD, 40), fill=(0, 77, 64))

    bx = 220
    pattern = [4, 2, 6, 3, 2, 8, 4, 2, 5, 3, 7, 2, 4, 6, 2, 3, 8, 2, 4, 5, 2, 6, 3, 4]
    for i, w in enumerate(pattern * 2):
        if i % 2 == 0:
            d.rectangle([bx, 1190, bx + w * 2, 1270], fill=(25, 28, 35))
        bx += w * 2 + 4

    out = os.path.join(OUT_DIR, "distributor_bill_paper.png")
    img.save(out)
    return out


def build_packaging_textures():
    # 1. Syrup bottle label
    BW, BH = 1024, 512
    bimg = Image.new("RGB", (BW, BH), (248, 252, 250))
    bd = ImageDraw.Draw(bimg)
    bd.rectangle([0, 0, BW, 110], fill=(0, 105, 92))
    bd.rectangle([0, 110, BW, 128], fill=(245, 158, 11))
    bd.text((54, 28), "StackPharmacy  Rx", font=font(FONT_BOLD, 50), fill=(255, 255, 255))
    bd.text((54, 164), "EXPECTORANT SYRUP", font=font(FONT_BOLD, 58), fill=(15, 23, 42))
    bd.text((54, 248), "100 ml   •   FEFO BATCH TRACKED", font=font(FONT_BOLD, 34), fill=(0, 105, 92))
    rounded_rect(bd, [54, 332, 660, 444], 18, fill=(230, 247, 244), outline=(0, 105, 92), width=3)
    bd.text((84, 350), "BATCH: AZT251", font=font(FONT_BOLD, 34), fill=(0, 77, 64))
    bd.text((84, 394), "EXPIRY: 08/2027  •  SAFE STOCK", font=font(FONT_REG, 28), fill=(15, 118, 110))
    bout = os.path.join(OUT_DIR, "syrup_bottle_label.png")
    bimg.save(bout)

    # 2. Medicine Carton Box Front
    MW, MH = 1024, 640
    mimg = Image.new("RGB", (MW, MH), (255, 255, 255))
    md = ImageDraw.Draw(mimg)
    md.rectangle([0, 0, MW, 165], fill=(0, 77, 64))
    md.rectangle([0, 165, MW, 185], fill=(45, 212, 191))
    md.text((60, 46), "DOLO-650", font=font(FONT_BOLD, 74), fill=(255, 255, 255))
    md.text((580, 72), "15 x 10 TABS", font=font(FONT_BOLD, 42), fill=(167, 243, 208))
    md.text((60, 240), "Paracetamol Tablets IP 650 mg", font=font(FONT_BOLD, 42), fill=(30, 41, 59))
    md.text((60, 320), "Batch: DPA238   •   Exp: 03/2028", font=font(FONT_BOLD, 36), fill=(0, 105, 92))
    rounded_rect(md, [60, 430, 620, 560], 22, fill=(240, 253, 250), outline=(0, 105, 92), width=3)
    draw_checkmark(md, 104, 495, 26, (0, 105, 92), width=6)
    md.text((144, 468), "AI SCANNED TO STOCK", font=font(FONT_BOLD, 36), fill=(0, 77, 64))
    mout = os.path.join(OUT_DIR, "med_box_front.png")
    mimg.save(mout)
    return bout, mout


if __name__ == "__main__":
    p1 = build_phone_screen()
    p1b = build_phone_scanning_state()
    p2 = build_invoice_paper()
    p3, p4 = build_packaging_textures()
    print("Regenerated clean textures:")
    for p in (p1, p1b, p2, p3, p4):
        print(" -", p)
