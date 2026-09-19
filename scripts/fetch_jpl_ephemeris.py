"""Install the exact verified kernel; never runs during an API calculation."""
from pathlib import Path
from od_toirog.cli import download_data

download_data(Path(__file__).resolve().parents[1]/'vendor/od-toirog-engine/data/de440s.bsp')
