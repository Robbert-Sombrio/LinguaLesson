# Storyboard sheet (shot, framing, duration, line under each) and the base-vs-mine style frame.
import sys
from PIL import Image, ImageDraw, ImageFont
P = sys.argv[1]
FONT = f"{P}/fonts/DMSans-VF.ttf"
def f(size, wght):
    ft = ImageFont.truetype(FONT, size)
    try: ft.set_variation_by_axes([14, wght])
    except Exception: pass
    return ft
INK, SLATE, BLUE, PAGE = (30, 38, 46), (73, 88, 103), (87, 115, 153), (247, 247, 255)
shots = [
    ("4.6", "01", "Wide · slow push-in", "0:00–0:18", "The room. The coral dot walks in, off grid."),
    ("33.9", "03", "Spread · hard pan in", "0:32–0:53", "02 Unflappable. Numeral climbs in steps."),
    ("50.8", "04", "Spread · locked", "0:32–0:53", "All 155 survive: the counter lands."),
    ("62.2", "05", "Spread · locked", "0:53–1:12", "Wi-Fi collapses: knife cuts, tallest first."),
    ("96.6", "06", "Split frame · 2 cells", "1:16–1:39", "Read the room + Strike the right tone."),
    ("131.6", "08", "Spread · re-flow", "2:03–2:17", "BLUF: the answer re-flows to the top."),
    ("158.6", "09", "Locked · silence", "2:17–2:40", "Music stops. The full stop lands."),
    ("186.3", "11", "Pull-out to the wall", "2:54–3:07", "Recap: the dot reads each term."),
    ("200", "12", "Locked · end card", "3:15–3:23", "Sean Watson & Dr. Howie Jacobson."),
]
TW, TH, CAP, PADX = 620, 349, 96, 20
cols = 3; rows = (len(shots) + cols - 1) // cols
sheet = Image.new("RGB", (PADX + cols * (TW + PADX), 150 + rows * (TH + CAP + 20)), PAGE)
d = ImageDraw.Draw(sheet)
d.text((PADX, 30), "Executive presence · storyboard", font=f(44, 800), fill=INK)
d.text((PADX, 90), "Fluent Edge Swiss · 1920×1080 · 24 fps · ~3:23 · narrator: Brian (ElevenLabs)", font=f(22, 500), fill=SLATE)
for k, (t, n, framing, dur, line) in enumerate(shots):
    x = PADX + (k % cols) * (TW + PADX); y = 150 + (k // cols) * (TH + CAP + 20)
    im = Image.open(f"{P}/stills/t_{t}.jpg").resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y)); d.rectangle([x, y, x + TW - 1, y + TH - 1], outline=(189, 213, 234))
    d.text((x, y + TH + 12), f"SHOT {n}   {framing.upper()}   {dur}", font=f(17, 700), fill=BLUE)
    d.text((x, y + TH + 40), line, font=f(24, 600), fill=INK)
sheet.save(f"{P}/storyboard.jpg", quality=90)
# style frame vs base
a = Image.open(f"{P}/stills/base_50.8.jpg"); b = Image.open(f"{P}/stills/t_50.8.jpg")
w, h = 960, 540
sv = Image.new("RGB", (w * 2 + 60, h + 110), PAGE); dv = ImageDraw.Draw(sv)
sv.paste(a.resize((w, h), Image.LANCZOS), (20, 80)); sv.paste(b.resize((w, h), Image.LANCZOS), (w + 40, 80))
dv.text((20, 24), "SWISS MOTION GRAPHICS (BASE)", font=f(22, 700), fill=BLUE)
dv.text((w + 40, 24), "FLUENT EDGE SWISS (YOURS)", font=f(22, 700), fill=BLUE)
sv.save(f"{P}/style/styleframe-vs-base.jpg", quality=90)
b.save(f"{P}/style/styleframe.jpg", quality=92)
print("ok")
