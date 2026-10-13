"""Key the flat grey backdrop out of the supplied ArchSaif logo PNG.

The artwork itself is not redrawn or altered: every pixel is un-mixed
against the known backdrop colour, so the ink colour, edges and the
printed grain texture survive exactly, just on a transparent canvas.

usage: python3 -I scripts/extract_logo.py <source.png> <out.png>
"""
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)

bg = np.median(rgb[:40, :40].reshape(-1, 3), axis=0)
lum = rgb @ np.array([0.299, 0.587, 0.114])
bg_lum = bg @ np.array([0.299, 0.587, 0.114])
ink_mask = lum < bg_lum - 120
ink = np.median(rgb[ink_mask], axis=0)
ink_lum = ink @ np.array([0.299, 0.587, 0.114])

alpha = np.clip((bg_lum - lum) / (bg_lum - ink_lum), 0, 1)
out = np.zeros(rgb.shape[:2] + (4,), dtype=np.uint8)
out[..., :3] = np.round(ink).astype(np.uint8)
out[..., 3] = np.round(alpha * 255).astype(np.uint8)

ys, xs = np.where(alpha > 0.02)
pad = 8
crop = out[max(ys.min() - pad, 0): ys.max() + pad, max(xs.min() - pad, 0): xs.max() + pad]
Image.fromarray(crop, "RGBA").save(dst, optimize=True)
print("backdrop", bg, "ink", ink, "size", crop.shape[1], "x", crop.shape[0])
