#!/usr/bin/env python3
"""Generate the MkDocs plugin catalog from the ``registry/*.json`` entries.

Writes the catalog page (``docs/plugins.md``), rendered as Material "grid
cards" with a search box and category filters (``docs/javascripts/catalog.js``),
and one page per plugin under ``docs/catalog/<id>.md``, so the published site
stays in sync with the registry without hand-editing Markdown. Run this after
``scripts/build_registry.mjs`` (for each plugin's ``bundleSha256``) and before
``mkdocs build``; the Pages and test workflows do both.
"""

from __future__ import annotations

import html
import json
import shutil
from pathlib import Path

SITE_URL = "https://plugins.geolibre.app"
APP_URL = "https://geolibre.app"
ROOT = Path(__file__).resolve().parent.parent
REGISTRY_DIR = ROOT / "registry"
BUILT_REGISTRY = ROOT / "plugin-registry.json"
OUTPUT = ROOT / "docs" / "plugins.md"
CATALOG_DIR = ROOT / "docs" / "catalog"


def load_entries() -> list[dict]:
    """Return the registry entries, with each plugin's bundle hash when built.

    Args:
        None.

    Returns:
        A list of plugin entry dictionaries, sorted by display name. Entries
        gain the generated ``bundleSha256`` when ``plugin-registry.json`` has
        been built.
    """
    entries = [
        json.loads(path.read_text(encoding="utf-8"))
        for path in REGISTRY_DIR.glob("*.json")
    ]
    if BUILT_REGISTRY.exists():
        hashes = {
            plugin["id"]: plugin.get("bundleSha256")
            for plugin in json.loads(BUILT_REGISTRY.read_text(encoding="utf-8"))[
                "plugins"
            ]
        }
        for entry in entries:
            if hashes.get(entry.get("id")):
                entry["bundleSha256"] = hashes[entry["id"]]
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


def text(value: object) -> str:
    """Escape registry text for Markdown, so it can't inject HTML.

    Args:
        value: A string from a registry entry.

    Returns:
        The HTML-escaped string.
    """
    return html.escape(str(value), quote=False)


def render_card(entry: dict) -> str:
    """Render a single registry entry as a Material grid card.

    Args:
        entry: A plugin entry dictionary from the registry.

    Returns:
        The Markdown for one card list item. Its title links to the plugin's
        own page.
    """
    name = text(entry.get("name", entry.get("id", "Unnamed plugin")))
    version = entry.get("version", "")
    description = text(entry.get("description", "").strip())

    meta_bits = []
    if entry.get("author"):
        meta_bits.append(f"**Author:** {text(entry['author'])}")
    if version:
        meta_bits.append(f"**Version:** {text(version)}")
    if entry.get("minGeoLibreVersion"):
        meta_bits.append(f"**Requires:** GeoLibre {text(entry['minGeoLibreVersion'])}+")
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

    title = f"[__{name}__](catalog/{entry['id']}.md)"
    lines = [f"-   :material-puzzle:{{ .lg .middle }} {title}", "", "    ---", ""]
    if description:
        lines += [f"    {description}", ""]
    if meta_line:
        lines += [f"    {meta_line}", ""]
    if tags_line:
        lines += [f"    {tags_line}", ""]
    if links_line:
        lines += [f"    {links_line}", ""]
    return "\n".join(lines).rstrip()


def render_filters(entries: list[dict]) -> str:
    """Render the search box and category filters above the cards.

    The controls start hidden and ``catalog.js`` reveals them, so the page
    reads normally without JavaScript.

    Args:
        entries: The registry entries listed on the page.

    Returns:
        The HTML for the filter controls.
    """
    categories = sorted({c for e in entries for c in e.get("categories") or []})
    buttons = "\n".join(
        f'    <button type="button" class="md-tag" data-category="{text(c)}" '
        f'aria-pressed="false">{text(c)}</button>'
        for c in categories
    )
    return (
        '<div class="plugin-filters" hidden>\n'
        '  <input type="search" class="plugin-search md-input" '
        'placeholder="Search plugins" aria-label="Search plugins">\n'
        '  <div class="plugin-categories" role="group" '
        'aria-label="Filter by category">\n'
        f"{buttons}\n"
        "  </div>\n"
        '  <p class="plugin-count" aria-live="polite"></p>\n'
        "</div>\n\n"
    )


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
    return (
        f"{header}{render_filters(entries)}"
        f'<div class="grid cards plugin-catalog" markdown>\n\n{cards}\n\n</div>\n'
    )


def render_plugin_page(entry: dict) -> str:
    """Render one plugin's own page.

    Args:
        entry: A plugin entry dictionary from the registry.

    Returns:
        The complete Markdown document for ``docs/catalog/<id>.md``.
    """
    plugin_id = entry["id"]
    name = entry.get("name", plugin_id)
    description = entry.get("description", "").strip()

    # JSON strings are valid YAML scalars, so registry text can't break the
    # front matter.
    front_matter = f"---\ntitle: {json.dumps(name)}\n"
    if description:
        front_matter += f"description: {json.dumps(description)}\n"
    front_matter += "---\n\n"

    buttons = [
        f"[:material-open-in-new: Open in GeoLibre]({APP_URL}/?plugin={plugin_id})"
        "{ .md-button .md-button--primary target=_blank }"
    ]
    if entry.get("homepage"):
        buttons.append(
            f"[:octicons-mark-github-16: Homepage]({entry['homepage']})"
            "{ .md-button target=_blank }"
        )

    rows = [("Plugin id", f"`{plugin_id}`")]
    if entry.get("version"):
        rows.append(("Version", text(entry["version"])))
    if entry.get("author"):
        rows.append(("Author", text(entry["author"])))
    if entry.get("minGeoLibreVersion"):
        rows.append(("Requires", f"GeoLibre {text(entry['minGeoLibreVersion'])}+"))
    if entry.get("categories"):
        rows.append(("Categories", " ".join(f"`{c}`" for c in entry["categories"])))
    if entry.get("manifestUrl"):
        manifest = absolute_manifest_url(entry["manifestUrl"])
        rows.append(("Manifest", f"[{manifest}]({manifest})"))
    if entry.get("source", {}).get("url"):
        rows.append(
            ("Release zip", f"[{entry['source']['url']}]({entry['source']['url']})")
        )
    if entry.get("bundleSha256"):
        rows.append(("Bundle SHA-256", f"`{entry['bundleSha256']}`"))
    details = "\n".join(f"- **{label}:** {value}" for label, value in rows)

    body = [f"# {text(name)}", ""]
    if description:
        body += [text(description), ""]
    body += [
        " ".join(buttons),
        "",
        details,
        "",
        "## Install",
        "",
        "- **GeoLibre on the web:** use **Open in GeoLibre** above. GeoLibre shows "
        "the plugin's details and asks you to confirm before installing it.",
        "- **Any GeoLibre, including the desktop app:** open **Settings → Manage "
        f"Plugins**, find **{text(name)}** and click **Install**.",
        "",
        "GeoLibre releases after 3.2.0 check the downloaded code against the "
        "bundle SHA-256 above before running it.",
        "",
        "[:material-arrow-left: All plugins](../plugins.md)",
        "",
    ]
    return front_matter + "\n".join(body)


def main() -> None:
    """Generate ``docs/plugins.md`` and ``docs/catalog/<id>.md`` from the registry.

    Args:
        None.

    Returns:
        None.
    """
    entries = load_entries()
    OUTPUT.write_text(render_page(entries), encoding="utf-8")
    # Rebuild the per-plugin pages from scratch, so a removed plugin's page
    # disappears too.
    shutil.rmtree(CATALOG_DIR, ignore_errors=True)
    CATALOG_DIR.mkdir(parents=True)
    for entry in entries:
        (CATALOG_DIR / f"{entry['id']}.md").write_text(
            render_plugin_page(entry), encoding="utf-8"
        )
    print(
        f"Wrote {OUTPUT.relative_to(ROOT)} and {len(entries)} pages in "
        f"{CATALOG_DIR.relative_to(ROOT)}/"
    )


if __name__ == "__main__":
    main()
