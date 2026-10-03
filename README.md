# Pin Tabs Left

Keep pinned Markdown tabs at the left of each tab group in Obsidian Desktop.
Use Obsidian's native **Pin** action; no extra buttons or settings are required.

## Behavior

Pinned tabs stay before unpinned tabs. Relative order within each section is preserved.

```text
Start:      tab1       tab2       tab3       tab4
Pin tab3:   tab3 [pin] tab1       tab2       tab4
Pin tab2:   tab3 [pin] tab2 [pin] tab1       tab4
Unpin tab3: tab2 [pin] tab3       tab1       tab4
```

- Each tab group is sorted independently, including groups in pop-out windows.
- Sidebar tabs are excluded.
- Sorting also runs when the layout is restored or tabs are moved.
- Existing tabs are moved in place without closing their views.
- Run **Pin Tabs Left: Unpin all tabs in current group** from the command palette to clear the current group's pins while keeping its order. It is available only when the current group contains pinned tabs. Assign a shortcut in **Settings → Hotkeys** if desired.

## Installation

This plugin has not yet been published to the community directory.
For a manual installation:

1. Download `main.js` and `manifest.json` from a published GitHub release.
2. Create `<vault>/.obsidian/plugins/pin-tabs-left/` and put both files directly inside it.
3. Reload Obsidian and enable **Pin Tabs Left** in **Settings → Community plugins**.

To install from source, build the project and copy the two files from `dist/pin-tabs-left/` instead.
No `styles.css` file is required.

## Compatibility

Requires Obsidian Desktop **1.14.3 or later**. Mobile is unsupported.
The tab reorder adapter uses guarded, undocumented `WorkspaceTabs` methods inspected in 1.14.3.
Future Obsidian updates may require an adapter update. If the expected structure is absent, the affected group is skipped and a single notice is shown.
Older versions and other desktop operating systems have not been validated.
Tabs of other view types in a Markdown tab group also participate in the pinned section.

## Privacy

The runtime works entirely offline. It does not read note contents, edit files, access files outside the vault, send network requests, collect telemetry, or require an account.
Pin states and tab order are saved through Obsidian's normal workspace behavior.
The optional development deployment script copies build files to a vault you explicitly configure; it is not included in the runtime bundle.

## Development

Use Node.js 20 or later and npm.

```sh
npm ci
npm test
npm run lint
npm run build
npm run check:release
```

`npm run build` produces portable release files without accessing a vault.
To copy builds to your local vault, copy `vault.config.example.json` to `vault.config.json` and set an absolute `vaultPath`, or set `OBSIDIAN_VAULT_PATH`.
The local config is ignored by Git.

- `npm run dev`: watch source changes and copy successful builds to the configured vault.
- `npm run build:vault`: build once and copy to the configured vault.
- `npm run deploy:vault`: copy the existing build to the configured vault.

Reload the plugin after copying a build. The watcher does not reload Obsidian automatically.
See [the release checklist](docs/RELEASING.md) for validation and publishing steps.

## License and attribution

Licensed under [0BSD](LICENSE).
Build tooling started from the official [Obsidian sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin), commit `07ceb81d1fb3384af611ebf665a1ec42a7e5926d`.
The sample's example features were removed. This project has its own implementation and repository history.
