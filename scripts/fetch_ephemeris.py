"""Download official Swiss Ephemeris planetary/lunar data for 1800–2399."""
from pathlib import Path
from urllib.request import urlopen

target=Path(__file__).resolve().parents[1]/'ephemeris'
target.mkdir(exist_ok=True)
for name in ('sepl_18.se1','semo_18.se1'):
    with urlopen(f'https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/{name}',timeout=120) as response:
        data=response.read()
    if len(data)<10000:raise ValueError(f'Invalid ephemeris download: {name}')
    (target/name).write_bytes(data)
    print(f'{name}: {len(data):,} bytes')
