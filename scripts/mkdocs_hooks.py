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
        page.edit_url = f"{config['repo_url']}/edit/main/registry/{src.stem}.json"
    return markdown
