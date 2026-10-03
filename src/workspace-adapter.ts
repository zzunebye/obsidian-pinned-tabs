import { WorkspaceLeaf, WorkspaceTabs } from "obsidian";

interface ReorderableTabs extends WorkspaceTabs {
  readonly autoManageDOM: false;
  readonly children: WorkspaceLeaf[];
  currentTab: number;
  insertChild(index: number, leaf: WorkspaceLeaf): void;
  removeChild(leaf: WorkspaceLeaf): void;
}

export function isReorderableTabs(value: unknown): value is ReorderableTabs {
  if (!(value instanceof WorkspaceTabs)) return false;
  if (!("children" in value) || !Array.isArray(value.children)) return false;
  if (!value.children.every((leaf: unknown) => leaf instanceof WorkspaceLeaf)) return false;
  if (!("currentTab" in value) || typeof value.currentTab !== "number") return false;
  if (!("autoManageDOM" in value) || value.autoManageDOM !== false) return false;
  if (!("insertChild" in value) || typeof value.insertChild !== "function") return false;
  return "removeChild" in value && typeof value.removeChild === "function";
}

export function moveLeavesInPlace(
  tabs: ReorderableTabs,
  desiredOrder: readonly WorkspaceLeaf[],
  selectedLeaf: WorkspaceLeaf | undefined,
): void {
  if (tabs.children.length !== desiredOrder.length || tabs.children.length < 2) return;
  if (!desiredOrder.every((leaf) => tabs.children.includes(leaf))) return;

  for (const [index, leaf] of desiredOrder.entries()) {
    if (tabs.children[index] === leaf) continue;
    tabs.removeChild(leaf);
    tabs.insertChild(index, leaf);
  }

  if (selectedLeaf) {
    const selectedIndex = tabs.children.indexOf(selectedLeaf);
    if (selectedIndex !== -1) tabs.currentTab = selectedIndex;
  }
}
