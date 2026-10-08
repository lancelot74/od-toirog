"""Install checksum-pinned Swiss planetary/lunar data during setup or build."""
from hashlib import sha256
from pathlib import Path
from urllib.request import urlopen

FILES = {
    'sepl_18.se1': 'ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66',
    'semo_18.se1': '1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7',
}
TARGET = Path(__file__).resolve().parents[1] / 'ephemeris'


def main():
    TARGET.mkdir(exist_ok=True)
    for name, expected in FILES.items():
        path = TARGET / name
        if path.exists() and sha256(path.read_bytes()).hexdigest() == expected:
            print(f'{name}: verified')
            continue
        with urlopen(f'https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/{name}', timeout=120) as response:
            data = response.read()
        if sha256(data).hexdigest() != expected:
            raise ValueError(f'Ephemeris checksum mismatch: {name}')
        path.write_bytes(data)
        print(f'{name}: installed and verified')


if __name__ == '__main__':
    main()
