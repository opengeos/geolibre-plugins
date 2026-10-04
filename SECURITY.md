# Security policy

GeoLibre plugins run with the app's full privileges: they can read the map,
the user's files and stored credentials, and on desktop call the app's native
commands. A malicious or compromised plugin is therefore a security problem
for everyone who installed it, and we treat a report of one as urgent.

## What to report here

- A plugin in this registry that is malicious, compromised, or leaks data:
  for example it sends map data, files or credentials to an unexpected host,
  loads code from a remote server, or hides what it does.
- A vulnerability in the registry itself: the release-zip mirror, the
  `plugins.geolibre.app` Worker, the usage counts, or this repository's CI
  workflows (for example a way for a pull request to run code with the
  workflows' secrets).

A vulnerability in the GeoLibre app, including its plugin loader, belongs in
[opengeos/GeoLibre](https://github.com/opengeos/GeoLibre/security). A bug in a
plugin that isn't a security problem (it crashes, or doesn't work) is an
ordinary issue: use the **Report a plugin** issue form.

## How to report

Report privately through GitHub:
[**Report a vulnerability**](https://github.com/opengeos/geolibre-plugins/security/advisories/new)
(the **Security** tab → **Report a vulnerability**). Please don't open a
public issue or pull request for a security problem, since that tells
attackers before installs are protected.

Include the plugin id and version (or the `bundleSha256` from
`plugin-registry.json`), what the code does and where (file and a snippet, or
a description of the behaviour), and how you found it.

## What happens next

1. A maintainer confirms the report.
2. If a plugin is malicious or dangerous, it is blocked first and investigated
   after: an entry in [`blocklist.json`](blocklist.json) stops it from loading
   on every GeoLibre install that checks the blocklist (releases after 3.2.0),
   either one bad release (by its `bundleSha256`) or every version. Its
   registry entry is removed or pointed at a fixed release.
3. For a vulnerability in the registry or its workflows, the fix is made in a
   private advisory and published when it is merged.
4. You are credited in the advisory unless you prefer not to be.

GeoLibre releases that support the blocklist check it at startup; older
releases don't, so their users are told through the advisory and the
GeoLibre release notes.
