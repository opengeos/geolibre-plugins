#!/usr/bin/env python3
"""Generate the MkDocs plugin catalog page from ``plugin-registry.json``.

The catalog (``docs/plugins.md``) is rendered as Material "grid cards", one per
registry entry, so the published site stays in sync with the registry without
hand-editing Markdown. Run this before ``mkdocs build`` (the Pages workflow does
this automatically).
"""

from __future__ import annotations

import json
from pathlib import Path

SITE_URL = "https://plugins.geolibre.app"
ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "plugin-registry.json"
OUTPUT = ROOT / "docs" / "plugins.md"


def load_entries() -> list[dict]:
    """Return the registry entries from ``plugin-registry.json``.

    Args:
        None.

    Returns:
        A list of plugin entry dictionaries, sorted by display name.
    """
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    entries = data["plugins"] if isinstance(data, dict) else data
    return sorted(entries, key=lambda e: str(e.get("name", "")).lower())


def absolute_manifest_url(manifest_url: str) -> str:
    """Resolve a possibly-relative registry ``manifestUrl`` to an absolute URL.

    Args:
        manifest_url: The ``manifestUrl`` value from a registry entry.

    Returns:
        The absolute URL on the published site, or the value unchanged when it
        is already absolute.
    """
    if manifest_url.startswith(("http://", "https://")):
        return manifest_url
    return f"{SITE_URL}/{manifest_url.lstrip('/')}"


def render_card(entry: dict) -> str:
    """Render a single registry entry as a Material grid card.

    Args:
        entry: A plugin entry dictionary from the registry.

    Returns:
        The Markdown for one card list item.
    """
    name = entry.get("name", entry.get("id", "Unnamed plugin"))
    version = entry.get("version", "")
    description = entry.get("description", "").strip()

    meta_bits = []
    if entry.get("author"):
        meta_bits.append(f"**Author:** {entry['author']}")
    if version:
        meta_bits.append(f"**Version:** {version}")
    if entry.get("minGeoLibreVersion"):
        meta_bits.append(f"**Requires:** GeoLibre {entry['minGeoLibreVersion']}+")
    meta_line = " · ".join(meta_bits)

    categories = entry.get("categories") or []
    tags_line = " ".join(f"`{c}`" for c in categories)

    links = []
    if entry.get("homepage"):
        links.append(
            f"[:octicons-mark-github-16: Homepage]({entry['homepage']}){{ target=_blank }}"
        )
    if entry.get("manifestUrl"):
        links.append(
            f"[:octicons-package-16: Manifest]({absolute_manifest_url(entry['manifestUrl'])}){{ target=_blank }}"
        )
    links_line = " · ".join(links)

    lines = [f"-   :material-puzzle:{{ .lg .middle }} __{name}__", "", "    ---", ""]
    if description:
        lines += [f"    {description}", ""]
    if meta_line:
        lines += [f"    {meta_line}", ""]
    if tags_line:
        lines += [f"    {tags_line}", ""]
    if links_line:
        lines += [f"    {links_line}", ""]
    return "\n".join(lines).rstrip()


def render_page(entries: list[dict]) -> str:
    """Render the full catalog page.

    Args:
        entries: The registry entries to list.

    Returns:
        The complete Markdown document for ``docs/plugins.md``.
    """
    count = len(entries)
    verb = "is" if count == 1 else "are"
    noun = "plugin" if count == 1 else "plugins"
    header = (
        "---\n"
        "hide:\n"
        "  - toc\n"
        "---\n\n"
        "# Plugins\n\n"
        f"There {verb} **{count}** {noun} in the registry. Install them from "
        "GeoLibre: open **Settings → Manage Plugins**, then **Install** from the "
        "**All** or **Not installed** tab. No manual URL entry needed.\n\n"
    )
    if not entries:
        return header + "_The registry is currently empty._\n"
    cards = "\n\n".join(render_card(e) for e in entries)
    return f'{header}<div class="grid cards" markdown>\n\n{cards}\n\n</div>\n'


def main() -> None:
    """Generate ``docs/plugins.md`` from the registry.

    Args:
        None.

    Returns:
        None.
    """
    OUTPUT.write_text(render_page(load_entries()), encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
