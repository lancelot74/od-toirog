"""Reproducibly vendor the supplied engine; never execute archive contents."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_KERNEL = 'c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2'
parser = argparse.ArgumentParser()
parser.add_argument('archive', type=Path)
args = parser.parse_args()
destination = ROOT / 'vendor/od-toirog-engine'
manifest = {}
with ZipFile(args.archive) as archive:
    for info in archive.infolist():
        path = PurePosixPath(info.filename)
        if info.is_dir():
            continue
        if path.is_absolute() or '..' in path.parts or path.parts[0] != 'od-toirog-engine':
            raise ValueError('Unexpected archive path')
        relative = Path(*path.parts[1:])
        if relative.parts[0] not in ('src', 'tests', 'examples', 'scripts', 'data') and relative.name not in (
            'README.md', 'CALCULATIONS.md', 'VALIDATION.md', 'THIRD_PARTY_NOTICES.md',
            'pyproject.toml', 'requirements-lock.txt', 'openapi.json',
        ):
            continue
        content = archive.read(info)
        digest = hashlib.sha256(content).hexdigest()
        if relative.parts[0] == 'data' and (str(relative) != 'data/de440s.bsp' or digest != EXPECTED_KERNEL):
            raise ValueError('Unexpected ephemeris checksum')
        output = destination / relative
        output.parent.mkdir(parents=True, exist_ok=True)
        if output.exists() and output.read_bytes() != content:
            raise ValueError(f'Refusing to overwrite modified import: {relative}')
        output.write_bytes(content)
        manifest[relative.as_posix()] = digest
(destination/'IMPORT.json').write_text(json.dumps({
    'archive': args.archive.name,
    'archive_sha256': hashlib.sha256(args.archive.read_bytes()).hexdigest(),
    'files': manifest,
}, indent=2)+'\n')
print(f'Imported {len(manifest)} verified files; kernel stays outside Git.')
