"""Optimize the user-supplied PNGs and externalize the supplied animation layers."""
import base64
from io import BytesIO
import re
from pathlib import Path
from PIL import Image, ImageOps

source = Path('/mnt/c/Users/garhy/Downloads')
target = Path(__file__).resolve().parents[1] / 'public/assets/illustration'
target.mkdir(parents=True, exist_ok=True)
for name in ('hero', 'compatibility', 'loading'):
    image = Image.open(source / f'{name} od toirog.png')
    image.thumbnail((1600, 1600))
    image.save(target / f'{name}.webp', quality=88)

html = (source / 'od-toirog-animation.html').read_text()
counter = 0
def externalize(match):
    global counter
    counter += 1
    filename = f'animation-layer-{counter}.webp'
    layer=Image.open(BytesIO(base64.b64decode(match.group(1)))).convert('RGBA')
    layer.save(target/filename,lossless=True,method=6,exact=True)
    if Image.open(target/filename).convert('RGBA').tobytes()!=layer.tobytes():
        raise ValueError('Lossless animation conversion changed pixels')
    # Remove only outputs from the earlier version of this script.
    (target/f'animation-layer-{counter}.png').unlink(missing_ok=True)
    return filename
html = re.sub(r'data:image/png;base64,([A-Za-z0-9+/=]+)', externalize, html)
html = html.replace('</style>', 'body{display:block;background:transparent}main{width:100%}.controls{display:none}</style>')
html = html.replace('<html lang="en">', '<html lang="mn">')
(target / 'animation.html').write_text(html)
print(f'Prepared three WebP assets and {counter} animation layers.')

og=ImageOps.fit(Image.open(source/'hero od toirog.png').convert('RGB'),(1200,630))
emblem=Image.open(source/'ChatGPT Image Aug 28, 2026, 11_22_08 PM (1).png').convert('RGBA')
emblem.thumbnail((450,450))
og.paste(emblem,(40,100),emblem)
og.save(target/'open-graph.jpg',quality=88)
