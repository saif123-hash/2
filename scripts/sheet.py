"""Tile rendered stills into one contact sheet with frame labels.
usage: python3 -I scripts/sheet.py <dir> <out.png> [cols]"""
import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
files = sorted(f for f in os.listdir(d) if f.startswith('f') and f.endswith('.png'))
ims = [Image.open(os.path.join(d, f)).convert('RGB') for f in files]
w, h = ims[0].size
s = 0.5
tw, th = int(w * s), int(h * s)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 6), rows * (th + 30)), 'white')
dr = ImageDraw.Draw(sheet)
for k, (im, f) in enumerate(zip(ims, files)):
    x, y = (k % cols) * (tw + 6), (k // cols) * (th + 30)
    sheet.paste(im.resize((tw, th)), (x, y + 26))
    dr.text((x + 4, y + 6), f[1:-4], fill='black')
sheet.save(out)
