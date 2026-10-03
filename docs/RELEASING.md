# Release checklist

## Validate locally

```sh
npm ci
npm test
npm run lint
npm run build
npm run check:release
```

The build must succeed without a local vault or `vault.config.json`.
The repository is named `obsidian-pinned-tabs`; the plugin display name is `Pinned Tabs`, and the manifest ID and installation folder are `pinned-tabs`. Earlier builds used `obsidian-pin-tabs` and `pin-tabs-left`; disable those builds before enabling the new ID. Custom hotkeys using either old ID must be reassigned.

## Manual acceptance

Use a disposable vault with the exact release files and enable the plugin.
Record Obsidian version, operating system, observations, and remaining gaps.

- Open four Markdown tabs. Pin tab3, pin tab2, unpin tab3. Verify the README sequence.
- Keep an editor active while another tab moves. Verify active file, selection, scroll, and undo history.
- In two tab groups, pin a tab in one group and verify the other group keeps its order.
- Run bulk unpin. Verify only the current group's pins clear, without moving tabs.
- Check bulk unpin is unavailable with no pinned tabs and while a sidebar view is active.
- Repeat pinning in a pop-out window.
- Drag a pinned tab after an unpinned tab; verify the pinned section is restored.
- Reload Obsidian; verify pin state and grouped order survive.
- Disable and re-enable the plugin; verify no duplicate events or notices.

Automated tests simulate the narrow workspace API needed by the plugin. They do not replace these real-app checks.

## Create a release

1. Confirm a public GitHub repository, author identity, and that the plugin name and ID are available in the current community directory.
2. Commit the source, manifest, version mapping, README, license, tests, and workflows. Keep local vault config and generated files untracked.
3. Keep `package.json`, `manifest.json`, and `versions.json` aligned. For later versions, `npm version patch` runs the version helper and creates a local version commit/tag; use it only when that Git action is intended. The first release is `0.1.0`.
4. Push a tag matching the manifest version exactly, without a `v` prefix. The release workflow validates the tag and creates a **draft** GitHub release with `main.js` and `manifest.json` from `dist/pinned-tabs/`.
5. Review the release notes, assets, and manual QA evidence, then publish the draft.
6. Follow the current official submission process: https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin . A local build or draft release is not community-directory approval.

No public repository, tag push, GitHub release, or directory submission is performed by the local build scripts.
