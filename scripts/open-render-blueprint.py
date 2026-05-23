from __future__ import annotations

import sys
import urllib.parse
import webbrowser


def normalize_repo_url(raw: str) -> str:
    url = raw.strip()
    if not url:
        raise ValueError("GitHub repo URL is required.")

    if url.startswith("git@github.com:"):
        url = "https://github.com/" + url[len("git@github.com:") :]

    if url.endswith(".git"):
        url = url[:-4]

    if not url.startswith("https://github.com/"):
        raise ValueError("Only GitHub HTTPS or SSH repo URLs are supported here.")

    return url


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/open-render-blueprint.py https://github.com/<you>/<repo>")
        return 1

    repo_url = normalize_repo_url(sys.argv[1])
    deeplink = "https://dashboard.render.com/blueprint/new?repo=" + urllib.parse.quote(
        repo_url, safe=":/"
    )
    print(deeplink)
    webbrowser.open(deeplink)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
