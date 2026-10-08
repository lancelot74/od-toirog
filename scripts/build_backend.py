"""Build-time data preparation. Runtime requests never download astronomy data."""
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]


def main():
    runpy.run_path(str(ROOT / "scripts/fetch_jpl_ephemeris.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "scripts/fetch_ephemeris.py"), run_name="__main__")
    from od_toirog.astronomy import SkyfieldProvider
    provider = SkyfieldProvider(ROOT / "vendor/od-toirog-engine/data/de440s.bsp")
    try:
        print("Verified JPL kernel:", provider.provenance.ephemeris_sha256)
    finally:
        provider.close()


if __name__ == "__main__":
    main()
