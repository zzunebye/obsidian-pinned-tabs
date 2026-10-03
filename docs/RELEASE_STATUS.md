# Release candidate status: 0.1.0

Checked on 2026-10-02.

## Completed

- Manifest ID changed to `pin-tabs-left` to comply with the current naming requirements.
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

The Software World vault now contains `.obsidian/plugins/pin-tabs-left/`, and its enabled-plugin file references the new ID. The previous development build was moved to `.obsidian/plugin-backups/obsidian-pin-tabs-0.1.0/`. Restart Obsidian to load the new ID. Existing custom hotkeys that reference the old ID need reassignment.

No public repository, Git commit, pushed tag, GitHub release, or community submission was created in this preparation step.
