from __future__ import annotations

from typing import Any

import requests

from .models import ArticleSnapshot, GraphContextSnapshot


def _rest_get(base_url: str, service_key: str, path: str) -> list[dict[str, Any]]:
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Accept": "application/json",
    }
    response = requests.get(f"{base_url.rstrip('/')}/rest/v1/{path}", headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()


def build_context_snapshot(base_url: str, service_key: str) -> GraphContextSnapshot:
    posts = _rest_get(base_url, service_key, "posts?select=id,title,slug,content,tags")
    projects = _rest_get(base_url, service_key, "projects?select=id,title,description,tags")
    links = _rest_get(base_url, service_key, "external_links?select=id,title,description,tags")
    nodes = _rest_get(base_url, service_key, "graph_nodes?select=id,label,address,group_type,radius")
    edges = _rest_get(base_url, service_key, "graph_links?select=id,source,target")

    articles = [
        ArticleSnapshot(
            source_type="post",
            source_id=row["id"],
            title=row["title"],
            slug=row.get("slug"),
            content=row.get("content") or "",
            tags=row.get("tags") or [],
        )
        for row in posts
    ]
    articles.extend(
        ArticleSnapshot(
            source_type="project",
            source_id=row["id"],
            title=row["title"],
            content=row.get("description") or "",
            tags=row.get("tags") or [],
        )
        for row in projects
    )
    articles.extend(
        ArticleSnapshot(
            source_type="external_link",
            source_id=row["id"],
            title=row["title"],
            content=row.get("description") or "",
            tags=row.get("tags") or [],
        )
        for row in links
    )

    return GraphContextSnapshot(articles=articles, nodes=nodes, edges=edges)
