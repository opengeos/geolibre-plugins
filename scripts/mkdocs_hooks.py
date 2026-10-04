"""MkDocs hooks for the plugin catalog site."""

from __future__ import annotations

from pathlib import PurePosixPath


def on_page_markdown(markdown, page, config, files):
    """Point a generated plugin page's edit link at its registry entry.

    The pages under ``catalog/`` are generated from ``registry/<id>.json`` by
    ``scripts/generate_plugins_page.py`` and are not committed, so the default
    edit link would 404.

    Args:
        markdown: The page's Markdown source.
        page: The MkDocs page.
        config: The MkDocs config.
        files: The site's files.

    Returns:
        The Markdown, unchanged.
    """
    src = PurePosixPath(page.file.src_uri)
    if src.parts[:1] == ("catalog",) and config.get("repo_url"):
        # edit_uri is "edit/<branch>/docs/"; reuse its branch.
        parts = (config.get("edit_uri") or "edit/main/").strip("/").split("/")
        branch = parts[1] if len(parts) > 1 and parts[0] == "edit" else "main"
        repo = config["repo_url"].rstrip("/")
        page.edit_url = f"{repo}/edit/{branch}/registry/{src.stem}.json"
    return markdown
