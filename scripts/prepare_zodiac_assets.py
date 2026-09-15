"""Import the supplied twelve scenes and two geometry-only SVG sprites."""
import argparse
from pathlib import Path
import xml.etree.ElementTree as ET
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
PLANETS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']
parser = argparse.ArgumentParser()
parser.add_argument('--downloads', type=Path, default=Path('/mnt/c/Users/garhy/Downloads'))
args = parser.parse_args()
target = ROOT / 'public/assets/zodiac'
sprites = ROOT / 'public/assets/sprites'
target.mkdir(parents=True, exist_ok=True)
sprites.mkdir(parents=True, exist_ok=True)
sheet = Image.new('RGB', (960, 720), '#0B0D10')
draw = ImageDraw.Draw(sheet)
for i, sign in enumerate(SIGNS):
    sources = list(args.downloads.glob(f'od-toirog-{sign}-*-2560x1600.png'))
    if len(sources) != 1:
        raise ValueError(f'Expected exactly one {sign} painting; found {len(sources)}')
    image = Image.open(sources[0]).convert('RGB')
    image.thumbnail((1600, 1000))
    image.save(target / f'{sign}.webp', quality=86, method=6)
    image.thumbnail((640, 400))
    image.save(target / f'{sign}-thumb.webp', quality=82, method=6)
    x, y = (i % 3) * 320, (i // 3) * 180
    sheet.paste(ImageOps.fit(image, (300, 150)), (x+10, y))
    draw.text((x+10, y+154), sign, fill='#D4AF37')
    print(f'{sign}: {(target / f"{sign}.webp").stat().st_size:,} bytes')

ET.register_namespace('', 'http://www.w3.org/2000/svg')
for kind, names in [('zodiac', SIGNS), ('planet', PLANETS)]:
    root = ET.parse(args.downloads / f'{kind}-sprite.svg').getroot()
    ids = {node.attrib['id'] for node in root if node.tag.endswith('symbol')}
    if ids != {f'ot-{name}' for name in names}:
        raise ValueError(f'Unexpected symbol IDs in {kind} sprite')
    for node in root.iter():
        if node.tag.split('}')[-1] not in {'svg', 'symbol', 'g', 'path', 'circle'}:
            raise ValueError('Expected geometry-only SVG')
        if any(key.lower().startswith('on') or 'href' in key for key in node.attrib):
            raise ValueError('Unexpected active SVG attribute')
    # display:none is for inline sprite installation; external <use> needs no hiding.
    root.attrib.pop('style', None)
    ET.ElementTree(root).write(sprites / f'{kind}.svg', encoding='unicode')

sheet.save('/tmp/opencode/zodiac-contact-sheet.jpg', quality=85)
print('Imported 12 scenes, 12 thumbnails, and both SVG sprites.')
