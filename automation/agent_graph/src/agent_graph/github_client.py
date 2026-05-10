from __future__ import annotations

from typing import Any

import requests


class GitHubClient:
    def __init__(self, repository: str, token: str) -> None:
        self.repository = repository
        self.token = token

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "agent-graph",
        }

    def merge_pull_request(self, pull_number: int, merge_method: str = "squash") -> dict[str, Any]:
        response = requests.put(
            f"https://api.github.com/repos/{self.repository}/pulls/{pull_number}/merge",
            headers=self._headers,
            json={"merge_method": merge_method},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
