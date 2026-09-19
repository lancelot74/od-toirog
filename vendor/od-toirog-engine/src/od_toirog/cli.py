import argparse
import json
from pathlib import Path
from urllib.request import urlopen

from .astronomy import (
    EPHEMERIS_SHA256,
    EPHEMERIS_URL,
    SkyfieldProvider,
    data_path,
    sha256_file,
)
from .engine import Engine
from .errors import DataError
from .models import DailyRequest, NatalRequest, SynastryRequest, TransitRequest


def download_data(path: Path) -> None:
    if path.is_file():
        if sha256_file(path) == EPHEMERIS_SHA256:
            print(f"Verified existing JPL DE440s data: {path}")
            return
        raise DataError("Existing file has a different checksum; move it before downloading again.")
    path.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation avoids overwriting another running download.
    temporary = path.with_suffix(".bsp.part")
    with temporary.open("xb") as output:
        try:
            with urlopen(EPHEMERIS_URL, timeout=60) as response:
                while chunk := response.read(1024 * 1024):
                    output.write(chunk)
        except BaseException:
            output.close()
            temporary.unlink(missing_ok=True)
            raise
    if sha256_file(temporary) != EPHEMERIS_SHA256:
        temporary.unlink()
        raise DataError("Downloaded data failed SHA-256 verification.")
    temporary.replace(path)
    print(f"Downloaded and verified JPL DE440s data: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Од Тойрог calculation engine")
    subparsers = parser.add_subparsers(dest="command", required=True)
    download = subparsers.add_parser("download-data", help="Download and verify NASA/JPL DE440s")
    download.add_argument("--path", type=Path, default=None)
    for name in ("natal", "synastry", "transits", "daily"):
        command = subparsers.add_parser(name, help=f"Calculate {name} from a JSON request")
        command.add_argument("input", type=Path)
    args = parser.parse_args()
    if args.command == "download-data":
        download_data(args.path or data_path())
        return
    request_type = {
        "natal": NatalRequest,
        "synastry": SynastryRequest,
        "transits": TransitRequest,
        "daily": DailyRequest,
    }[args.command]
    request = request_type.model_validate(json.loads(args.input.read_text(encoding="utf-8")))
    provider = SkyfieldProvider()
    try:
        response = getattr(Engine(provider), args.command)(request)
        print(response.model_dump_json(indent=2))
    finally:
        provider.close()


if __name__ == "__main__":
    main()
