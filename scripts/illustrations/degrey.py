"""Turn the violet accents of the isometric illustrations into the palette's warm greys.

usage: degrey.py IN.png OUT.png

Pixels are weighted by how close their hue is to the violet (about 255 deg) and how saturated they are; edges and
faint tints blend in smoothly. Strong accents take a mid warm grey that keeps their own light and shade (a remap of
their luminance into roughly 160-230), so they still read on white; faint tints are just desaturated. Everything
else, and the alpha, is left as it was.
"""
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1:3]
im = Image.open(src).convert("RGBA")
a = np.asarray(im).astype(np.float32)
rgb, alpha = a[..., :3] / 255.0, a[..., 3:]

mx, mn = rgb.max(-1), rgb.min(-1)
d = mx - mn
s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
h = np.zeros_like(mx)
nz = d > 1e-6
h = np.where(nz & (mx == r), ((g - b) / np.maximum(d, 1e-6)) % 6, h)
h = np.where(nz & (mx == g), (b - r) / np.maximum(d, 1e-6) + 2, h)
h = np.where(nz & (mx == b), (r - g) / np.maximum(d, 1e-6) + 4, h)
hue = h * 60.0

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

dist = np.minimum(np.abs(hue - 255), 360 - np.abs(hue - 255))
w_hue = 1 - smooth(30, 55, dist)           # full within 30 deg of violet, gone past 55
w = w_hue * smooth(0.03, 0.12, s)           # any noticeable tint
t = smooth(0.15, 0.40, s)                   # how much of an accent it is

L = (0.299 * r + 0.587 * g + 0.114 * b) * 255
mapped = np.clip(160 + (L - 60) * 0.5, 150, 236)
tL = (1 - t) * L + t * mapped
warm = np.stack([tL + 1, tL, tL - 4], -1)   # the palette's warm grey cast (#E9E8E4 is 233, 232, 228)
out = rgb * 255 * (1 - w[..., None]) + warm * w[..., None]
res = np.concatenate([np.clip(out, 0, 255), alpha], -1).round().astype(np.uint8)
Image.fromarray(res, "RGBA").save(dst)

# report what is left: saturation of reasonably opaque, violet-ish pixels
o = np.asarray(Image.open(dst).convert("RGBA")).astype(np.float32) / 255
mx2, mn2 = o[..., :3].max(-1), o[..., :3].min(-1)
s2 = np.where(mx2 > 0, (mx2 - mn2) / np.maximum(mx2, 1e-6), 0)
vis = o[..., 3] > 0.5
print(f"{src.split('/')[-1]:16s} violet px changed {100 * (w > 0.5)[vis].mean():5.1f}%  max sat left {s2[vis].max():.2f}  p99 sat {np.percentile(s2[vis], 99):.2f}")
