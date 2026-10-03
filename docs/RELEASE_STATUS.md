# Release candidate status: 0.1.0

Checked on 2026-10-02.

## Completed

- The display name is `Pinned Tabs`; the plugin ID and install folder are `pinned-tabs`. The suggested repository name is `obsidian-pinned-tabs`.
- English README covers behavior, manual installation, privacy, compatibility, and development.
- 0BSD license metadata and sample tooling attribution are present.
- Production builds require no local vault and contain no local filesystem paths.
- Local development deployment is configured through an ignored file or environment variable.
- CI runs tests, lint, build, and artifact validation.
- Tag releases validate the exact version and create a draft with the correct two artifacts.
- Eight workspace simulation tests passed: requested ordering, main/popout groups, bulk unpin, command checks, sidebar exclusion, adapter incompatibility, and unload cleanup.
- A separate source copy without `vault.config.json` passed `npm ci --offline`, tests, lint, build, and artifact validation.
- Release tag `0.1.0` was accepted; `v0.1.0` was rejected.

## Required before public release

- Run the real-app manual acceptance checklist in `RELEASING.md`. Automated workspace simulations do not establish editor selection, scroll, undo, actual DOM updates, pop-out behavior, or restart persistence.
- Confirm author identity (currently `June`) and the intended public GitHub repository.
- Recheck name and ID availability in the live community directory at submission time.
- Commit/push the source, tag the version, inspect the draft release, and publish it.
- Follow the current official community submission process.

## UI verification limitation

Obsidian 1.14.3 on macOS was observed running the Software World vault. Two attempted menu actions were blocked by computer-use state checks reporting concurrent user changes. No pin/unpin actions were performed and no user notes were edited. A disposable test vault was prepared but not opened. Real-app acceptance is therefore still pending, and this candidate is not claimed to be fully verified for public release.

## Local migration

The Software World vault still uses earlier IDs. Move `pin-tabs-left` to `.obsidian/plugin-backups/pin-tabs-left-0.1.0/`, copy the new `pinned-tabs` build, and replace the old IDs in the enabled-plugin list. Restart Obsidian to load it. Existing custom hotkeys using an old ID need reassignment.

No public repository, Git commit, pushed tag, GitHub release, or community submission was created in this preparation step.
