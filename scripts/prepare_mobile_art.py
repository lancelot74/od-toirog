"""Optimize the supplied portrait artwork without cropping, padding or repositioning."""
import argparse
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
parser=argparse.ArgumentParser()
parser.add_argument('--zip',type=Path,default=Path('/mnt/c/Users/garhy/Downloads/mobile-zodiacs-all-12.zip'))
parser.add_argument('--hero',type=Path,default=Path('/mnt/c/Users/garhy/Downloads/mobile-hero.png'))
args=parser.parse_args()

def optimize(content,folder,stem,widths,expected_size):
    image=Image.open(BytesIO(content)).convert('RGB')
    if image.size!=expected_size:raise ValueError(f'Unexpected dimensions for {stem}: {image.size}')
    destination=ROOT/'public/assets'/folder
    destination.mkdir(parents=True,exist_ok=True)
    variants=[]
    for width in widths:
        size=(width,round(width*image.height/image.width))
        output=destination/f'{stem}-{width}.webp'
        image.resize(size,Image.Resampling.LANCZOS).save(output,quality=85,method=6)
        variants.append({'path':f'/assets/{folder}/{output.name}','width':size[0],'height':size[1],'bytes':output.stat().st_size})
    return image,{'source_sha256':sha256(content).hexdigest(),'width':image.width,'height':image.height,'variants':variants}

manifest={'zip_sha256':sha256(args.zip.read_bytes()).hexdigest(),'zodiac':{}}
sheet=Image.new('RGB',(720,900),'#0B0D10');draw=ImageDraw.Draw(sheet)
with ZipFile(args.zip) as archive:
    expected={f'mobile-{slug}.png' for slug in SIGNS}
    if set(archive.namelist())!=expected or len(archive.infolist())!=12:raise ValueError('Expected exactly the twelve named portrait PNGs')
    for i,slug in enumerate(SIGNS):
        image,record=optimize(archive.read(f'mobile-{slug}.png'),'zodiac/mobile',slug,[384,768,1024],(1024,1536))
        manifest['zodiac'][slug]=record
        image.thumbnail((174,261))
        x,y=(i%4)*180,(i//4)*300
        sheet.paste(image,(x+3,y));draw.text((x+8,y+270),slug,fill='#D4AF37')
_,manifest['hero']=optimize(args.hero.read_bytes(),'illustration/mobile','hero',[450,900,1440],(1440,2560))
destination=ROOT/'public/assets/mobile'
destination.mkdir(parents=True,exist_ok=True)
(destination/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
sheet.save('/tmp/opencode/mobile-zodiac-contact-sheet.jpg',quality=85)
print('Prepared 39 portrait WebP variants; no cropping or color overlays.')
print('Hero sizes:',[(v['width'],v['bytes']) for v in manifest['hero']['variants']])
print('Zodiac maximum-size total:',sum(v['variants'][-1]['bytes'] for v in manifest['zodiac'].values()))
