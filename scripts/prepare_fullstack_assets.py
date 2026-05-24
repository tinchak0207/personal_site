from __future__ import annotations

import io
import zipfile
from pathlib import Path

import requests


USER_RELEASE_URL = "https://github.com/dujiao-next/user/releases/download/v1.1.0/dujiao-next-user-v1.1.0.zip"
ADMIN_RELEASE_URL = "https://github.com/dujiao-next/admin/releases/download/v1.1.0/dujiao-next-admin-v1.1.0.zip"


def _extract_dist(zip_bytes: bytes, destination: Path) -> None:
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
        for member in archive.infolist():
            if not member.filename.startswith("dist/") or member.is_dir():
                continue
            relative = Path(member.filename).relative_to("dist")
            target = destination / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(member.filename))


def _download(url: str) -> bytes:
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return response.content


def prepare_fullstack_assets(dist_root: Path) -> None:
    user_root = dist_root / "user"
    admin_root = dist_root / "admin"
    _extract_dist(_download(USER_RELEASE_URL), user_root)
    _extract_dist(_download(ADMIN_RELEASE_URL), admin_root)


def main() -> int:
    dist_root = Path(__file__).resolve().parents[1] / "internal" / "web" / "dist"
    prepare_fullstack_assets(dist_root)
    print(dist_root)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
