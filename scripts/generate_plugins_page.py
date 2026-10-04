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
import re
from pathlib import Path
from urllib.parse import quote

SITE_URL = "https://plugins.geolibre.app"
# The GeoLibre web app (geolibre.app is the project website). Its
# ?plugin=<id> deep link shows a registry plugin and asks to install it.
APP_URL = "https://web.geolibre.app"
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
        gain the generated ``bundleSha256``, and their screenshots a ``url``,
        when ``plugin-registry.json`` has been built.
    """
    entries = [
        json.loads(path.read_text(encoding="utf-8"))
        for path in REGISTRY_DIR.glob("*.json")
    ]
    if BUILT_REGISTRY.exists():
        built = {
            plugin["id"]: plugin
            for plugin in json.loads(BUILT_REGISTRY.read_text(encoding="utf-8"))[
                "plugins"
            ]
        }
        for entry in entries:
            plugin = built.get(entry.get("id"), {})
            for field in ("bundleSha256", "screenshots"):
                if plugin.get(field):
                    entry[field] = plugin[field]
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


PLUGIN_ID = re.compile(r"[a-z0-9]+(?:[._-][a-z0-9]+)*")
# Markdown punctuation that could start a link, image, emphasis, code span or
# attribute list. Backslash-escaping these makes registry text literal.
MARKDOWN_SPECIAL = re.compile(r"([\\`*_{}\[\]()#+\-.!|~])")


def text(value: object) -> str:
    """Escape registry text so it renders literally in Markdown.

    Registry entries come from contributors' pull requests, so neither HTML
    nor Markdown syntax in them (e.g. ``[x](javascript:...)``) may take effect.

    Args:
        value: A string from a registry entry.

    Returns:
        The text with HTML escaped and Markdown punctuation backslash-escaped.
    """
    return MARKDOWN_SPECIAL.sub(r"\\\1", html.escape(str(value), quote=False))


def safe_url(value: object) -> str | None:
    """Return a registry URL fit for a Markdown link, or None.

    Args:
        value: A URL from a registry entry.

    Returns:
        The URL with spaces, parentheses and angle brackets percent-encoded,
        or None unless it is an http(s) URL.
    """
    url = str(value or "").strip()
    if not re.match(r"^https?://", url):
        return None
    return quote(url, safe=":/?#@!$&'*+,;=%~[]")


def is_tag(category: object) -> bool:
    """Whether a category is a plain word that renders as a tag.

    Args:
        category: A category from a registry entry.

    Returns:
        True for plain words (the schema's fixed list).
    """
    return isinstance(category, str) and bool(
        re.fullmatch(r"[A-Za-z][A-Za-z ]*", category)
    )


def tags(categories: list[object]) -> str:
    """Render categories as code-span tags.

    Code spans show backslash escapes literally, so only plain category words
    (the schema's fixed list) are rendered; anything else is dropped.

    Args:
        categories: The entry's categories.

    Returns:
        The tags, separated by spaces.
    """
    return " ".join(f"`{c}`" for c in categories if is_tag(c))


def link(label: str, url: object, attrs: str = "") -> str | None:
    """Render a Markdown link to a registry URL, or None if it isn't http(s).

    Args:
        label: The link text (already Markdown).
        url: The URL from the registry.
        attrs: An optional attribute list, e.g. ``{ target=_blank }``.

    Returns:
        The Markdown link, or None.
    """
    href = safe_url(url)
    return f"[{label}]({href}){attrs}" if href else None


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
    # One line: the card is an indented list item, so a newline would end it.
    description = text(" ".join(str(entry.get("description", "")).split()))

    meta_bits = []
    if entry.get("author"):
        meta_bits.append(f"**Author:** {text(entry['author'])}")
    if version:
        meta_bits.append(f"**Version:** {text(version)}")
    if entry.get("minGeoLibreVersion"):
        meta_bits.append(f"**Requires:** GeoLibre {text(entry['minGeoLibreVersion'])}+")
    meta_line = " · ".join(meta_bits)

    tags_line = tags(entry.get("categories") or [])

    links = [
        link(
            ":octicons-mark-github-16: Homepage",
            entry.get("homepage"),
            "{ target=_blank }",
        ),
        link(
            ":octicons-package-16: Manifest",
            absolute_manifest_url(str(entry.get("manifestUrl", ""))),
            "{ target=_blank }",
        )
        if entry.get("manifestUrl")
        else None,
    ]
    links_line = " · ".join(item for item in links if item)

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
    """Render the search box, sort menu and category filters above the cards.

    The controls start hidden and ``catalog.js`` reveals them, so the page
    reads normally without JavaScript.

    Args:
        entries: The registry entries listed on the page.

    Returns:
        The HTML for the filter controls.
    """
    # The same categories the cards show, so every button matches some card.
    categories = sorted(
        {c for e in entries for c in e.get("categories") or [] if is_tag(c)}
    )
    # A raw HTML block: Markdown isn't processed here, so escape for HTML only.
    buttons = "\n".join(
        f'    <button type="button" class="md-tag" data-category="{html.escape(c)}" '
        f'aria-pressed="false">{html.escape(c)}</button>'
        for c in categories
    )
    return (
        '<div class="plugin-filters" hidden>\n'
        '  <div class="plugin-filter-row">\n'
        '    <input type="search" class="plugin-search md-input" '
        'placeholder="Search plugins" aria-label="Search plugins">\n'
        '    <label class="plugin-sort">Sort by\n'
        '      <select class="plugin-sort-select">\n'
        '        <option value="name">Name</option>\n'
        # Enabled by catalog.js once plugins/stats.json has loaded.
        '        <option value="users" disabled>Most used</option>\n'
        '        <option value="launches" disabled>Most launches</option>\n'
        "      </select>\n"
        "    </label>\n"
        "  </div>\n"
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


# A screenshot URL as build_registry.mjs writes it: plugins/<folder>/<version>/
# plus a path matching screenshots[].path in schemas/registry-entry.schema.json
# (keep the two in step).
SCREENSHOT_URL = re.compile(
    r"plugins/[a-z0-9]+(?:[._-][a-z0-9]+)*/[0-9A-Za-z.+-]+/"
    r"[A-Za-z0-9._@+-]+(?:/[A-Za-z0-9._@+-]+)*\.(?:png|jpe?g|webp)"
)


def render_screenshots(entry: dict) -> list[str]:
    """Render an entry's screenshots as captioned images.

    Args:
        entry: A plugin entry dictionary, with screenshot URLs from the built
            registry.

    Returns:
        Markdown lines for a "Screenshots" section, or an empty list when the
        entry has none (or the registry hasn't been built).
    """
    lines = []
    for shot in entry.get("screenshots") or []:
        url = str(shot.get("url") or "")
        # Built by build_registry.mjs from schema-checked paths; anything else
        # is skipped rather than written into the page.
        if not SCREENSHOT_URL.fullmatch(url) or ".." in url.split("/"):
            continue
        # Plain HTML, which Markdown leaves alone, so escape for HTML only
        # (quotes too, for the alt attribute).
        caption = html.escape(" ".join(str(shot.get("caption", "")).split()))
        lines += [
            f'<figure><img src="{SITE_URL}/{url}" alt="{caption}" loading="lazy">'
            f"<figcaption>{caption}</figcaption></figure>",
            "",
        ]
    return ["## Screenshots", "", *lines] if lines else []


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

    # The theme writes title and description into <title> and a <meta>
    # attribute without escaping (MkDocs templates don't autoescape), so escape
    # them for HTML, quotes included. JSON strings are valid YAML scalars, so
    # they can't break the front matter either.
    front_matter = f"---\ntitle: {json.dumps(html.escape(name))}\n"
    if description:
        front_matter += f"description: {json.dumps(html.escape(description))}\n"
    front_matter += "---\n\n"

    buttons = [
        f"[:material-open-in-new: Open in GeoLibre]({APP_URL}/?plugin={plugin_id})"
        "{ .md-button .md-button--primary target=_blank }"
    ]
    homepage = link(
        ":octicons-mark-github-16: Homepage",
        entry.get("homepage"),
        "{ .md-button target=_blank }",
    )
    if homepage:
        buttons.append(homepage)

    rows = [("Plugin id", f"`{plugin_id}`")]
    if entry.get("version"):
        rows.append(("Version", text(entry["version"])))
    if entry.get("author"):
        rows.append(("Author", text(entry["author"])))
    if entry.get("license"):
        rows.append(("License", text(entry["license"])))
    if entry.get("minGeoLibreVersion"):
        rows.append(("Requires", f"GeoLibre {text(entry['minGeoLibreVersion'])}+"))
    if tags(entry.get("categories") or []):
        rows.append(("Categories", tags(entry["categories"])))
    for label, field in (("Source code", "repository"), ("Report an issue", "issues")):
        url = entry.get(field)
        url_link = link(text(url), url) if url else None
        if url_link:
            rows.append((label, url_link))
    if entry.get("manifestUrl"):
        manifest = absolute_manifest_url(str(entry["manifestUrl"]))
        manifest_link = link(text(manifest), manifest)
        if manifest_link:
            rows.append(("Manifest", manifest_link))
    source_url = (entry.get("source") or {}).get("url")
    source_link = link(text(source_url), source_url) if source_url else None
    if source_link:
        rows.append(("Release zip", source_link))
    bundle_hash = str(entry.get("bundleSha256") or "")
    if re.fullmatch(r"[0-9a-f]{64}", bundle_hash):
        rows.append(("Bundle SHA-256", f"`{bundle_hash}`"))
    else:
        bundle_hash = ""
    details = "\n".join(f"- **{label}:** {value}" for label, value in rows)

    body = [f"# {text(name)}", ""]
    if description:
        body += [text(description), ""]
    body += [
        " ".join(buttons),
        "",
        details,
        "",
        *render_screenshots(entry),
        "## Install",
        "",
        "- **GeoLibre on the web:** use **Open in GeoLibre** above. GeoLibre shows "
        "the plugin's details and asks you to confirm before installing it.",
        "- **Any GeoLibre, including the desktop app:** open **Settings → Manage "
        f"Plugins**, find **{text(name)}** and click **Install**.",
        "",
    ]
    if bundle_hash:
        body += [
            "GeoLibre releases after 3.2.0 check the downloaded code against the "
            "bundle SHA-256 above before running it.",
            "",
        ]
    body += ["[:material-arrow-left: All plugins](../plugins.md)", ""]
    return front_matter + "\n".join(body)


def main() -> None:
    """Generate ``docs/plugins.md`` and ``docs/catalog/<id>.md`` from the registry.

    Args:
        None.

    Returns:
        None.
    """
    entries = load_entries()
    # The id becomes a file name, a link and a URL parameter, so it must be a
    # plain id (validate_plugins.mjs enforces the same pattern).
    for entry in entries:
        if not PLUGIN_ID.fullmatch(str(entry.get("id", ""))):
            raise SystemExit(
                f"Refusing to generate a page for plugin id {entry.get('id')!r}"
            )
    OUTPUT.write_text(render_page(entries), encoding="utf-8")
    # Update the per-plugin pages in place (so `mkdocs serve` only sees real
    # changes) and remove pages of plugins no longer in the registry.
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    pages = {f"{entry['id']}.md": render_plugin_page(entry) for entry in entries}
    for name, content in pages.items():
        page = CATALOG_DIR / name
        if not page.exists() or page.read_text(encoding="utf-8") != content:
            page.write_text(content, encoding="utf-8")
    for stale in CATALOG_DIR.glob("*.md"):
        if stale.name not in pages:
            stale.unlink()
    print(
        f"Wrote {OUTPUT.relative_to(ROOT)} and {len(entries)} pages in "
        f"{CATALOG_DIR.relative_to(ROOT)}/"
    )


if __name__ == "__main__":
    main()
