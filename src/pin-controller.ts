import { Notice, Plugin, View, WorkspaceLeaf, WorkspaceTabs, WorkspaceWindow } from "obsidian";
import { stablePinnedOrder } from "./tab-order";
import { isReorderableTabs, moveLeavesInPlace } from "./workspace-adapter";

export class PinController {
  private readonly boundLeaves = new WeakSet<WorkspaceLeaf>();
  private frame: number | undefined;
  private started = false;
  private compatibilityNoticeShown = false;

  constructor(private readonly plugin: Plugin) {}

  start(): void {
    if (this.started) return;
    this.started = true;

    this.plugin.register(() => {
      if (this.frame !== undefined) window.cancelAnimationFrame(this.frame);
      this.frame = undefined;
    });

    this.plugin.app.workspace.onLayoutReady(() => {
      if (!this.started) return;
      this.bindLeaves();
      this.plugin.registerEvent(
        this.plugin.app.workspace.on("layout-change", () => {
          this.bindLeaves();
          this.scheduleNormalization();
        }),
      );
      this.scheduleNormalization();
    });
  }

  stop(): void {
    this.started = false;
  }

  unpinCurrentGroup(checking: boolean): boolean {
    const workspace = this.plugin.app.workspace;
    const activeLeaf = workspace.getActiveViewOfType(View)?.leaf;
    if (!activeLeaf || !this.isManagedArea(activeLeaf)) return false;
    const group = activeLeaf.parent;
    if (!(group instanceof WorkspaceTabs)) return false;

    const pinnedLeaves: WorkspaceLeaf[] = [];
    workspace.iterateAllLeaves((leaf) => {
      if (leaf.parent === group && leaf.getViewState().pinned === true) {
        pinnedLeaves.push(leaf);
      }
    });
    if (pinnedLeaves.length === 0) return false;
    if (!checking) {
      for (const leaf of pinnedLeaves) leaf.setPinned(false);
    }
    return true;
  }

  private bindLeaves(): void {
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      if (this.boundLeaves.has(leaf)) return;
      this.boundLeaves.add(leaf);
      this.plugin.registerEvent(
        leaf.on("pinned-change", () => {
          if (this.isManagedArea(leaf) && leaf.getViewState().type === "markdown") {
            this.scheduleNormalization();
          }
        }),
      );
    });
  }

  private scheduleNormalization(): void {
    if (!this.started || this.frame !== undefined) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = undefined;
      this.normalizeGroups();
    });
  }

  private normalizeGroups(): void {
    const groups = new Set<WorkspaceTabs>();
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      if (this.isManagedArea(leaf) && leaf.parent instanceof WorkspaceTabs) groups.add(leaf.parent);
    });

    for (const parent of groups) {
      if (!isReorderableTabs(parent)) {
        this.showCompatibilityNotice();
        continue;
      }
      const currentOrder = [...parent.children];
      const desiredOrder = stablePinnedOrder(
        currentOrder,
        (leaf) => leaf.getViewState().pinned === true,
      );
      if (currentOrder.every((leaf, index) => desiredOrder[index] === leaf)) continue;

      const selectedLeaf = parent.children[parent.currentTab];
      moveLeavesInPlace(parent, desiredOrder, selectedLeaf);
    }
  }

  private isManagedArea(leaf: WorkspaceLeaf): boolean {
    const workspace = this.plugin.app.workspace;
    const root = leaf.getRoot();
    const container = leaf.getContainer();
    return root === workspace.rootSplit || container instanceof WorkspaceWindow;
  }

  private showCompatibilityNotice(): void {
    if (this.compatibilityNoticeShown) return;
    this.compatibilityNoticeShown = true;
    new Notice("Pinned Tabs could not safely reorder this tab group.");
  }
}
