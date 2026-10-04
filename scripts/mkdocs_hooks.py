"""MkDocs hooks for the plugin catalog site."""

from __future__ import annotations

import hashlib
from pathlib import Path, PurePosixPath


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


def _with_content_hash(path: str, docs_dir: str) -> str:
    """Append a short content hash to a local asset path.

    Args:
        path: An ``extra_css``/``extra_javascript`` path relative to docs_dir.
        docs_dir: The MkDocs docs directory.

    Returns:
        ``path?v=<hash>`` for a local file, or the path unchanged for URLs and
        missing files.
    """
    if "://" in path or path.startswith("//") or "?" in path:
        return path
    file = Path(docs_dir) / path
    if not file.is_file():
        return path
    digest = hashlib.sha256(file.read_bytes()).hexdigest()[:10]
    return f"{path}?v={digest}"


def on_config(config):
    """Version the site's own CSS and JS URLs by content.

    Cloudflare gives these files a 4-hour browser cache, so without a changing
    URL a returning visitor keeps the previous stylesheet or script for hours
    after a deploy. A content hash in the query string changes the URL exactly
    when the file changes.

    Args:
        config: The MkDocs config.

    Returns:
        The config, with hashed asset URLs.
    """
    docs_dir = config["docs_dir"]
    config["extra_css"] = [
        _with_content_hash(path, docs_dir) for path in config["extra_css"]
    ]
    # extra_javascript holds plain paths or script objects with a .path.
    scripts = []
    for script in config["extra_javascript"]:
        if isinstance(script, str):
            scripts.append(_with_content_hash(script, docs_dir))
        else:
            script.path = _with_content_hash(script.path, docs_dir)
            scripts.append(script)
    config["extra_javascript"] = scripts
    return config
