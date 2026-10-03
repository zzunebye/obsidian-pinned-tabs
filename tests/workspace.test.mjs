import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/main.ts"], bundle: true, format: "cjs",
  external: ["obsidian"], write: false,
});

function workspaceFixture({ ready = true } = {}) {
  const frames = new Map();
  const notices = [];
  const groups = [];
  const root = {};
  let frameId = 0;
  let readyCallback;
  let activeLeaf;
  const layout = new EventEmitter();
  class WorkspaceWindow {}
  class View {}
  class WorkspaceLeaf {
    constructor(name, parent, pinned = false) {
      this.name = name;
      this.parent = parent;
      this.pinned = pinned;
      this.events = new EventEmitter();
      parent.children.push(this);
    }
    getViewState() { return { type: "markdown", pinned: this.pinned }; }
    getRoot() { return this.parent.area; }
    getContainer() { return this.parent.area; }
    on(event, callback) {
      this.events.on(event, callback);
      return () => this.events.off(event, callback);
    }
    setPinned(pinned) {
      this.pinned = pinned;
      this.events.emit("pinned-change", pinned);
      layout.emit("layout-change");
    }
  }
  class WorkspaceTabs {
    constructor(area = root) {
      this.children = [];
      this.currentTab = 0;
      this.autoManageDOM = false;
      this.area = area;
      groups.push(this);
    }
    removeChild(leaf) {
      const index = this.children.indexOf(leaf);
      this.children.splice(index, 1);
      if (this.currentTab >= index && this.currentTab > 0) this.currentTab--;
      layout.emit("layout-change");
    }
    insertChild(index, leaf) {
      this.children.splice(index, 0, leaf);
      leaf.parent = this;
      layout.emit("layout-change");
    }
  }
  class Plugin {
    cleanups = [];
    register(callback) { this.cleanups.push(callback); }
    registerEvent(dispose) { this.cleanups.push(dispose); }
    addCommand(command) { this.command = command; }
  }
  class Notice { constructor(message) { notices.push(message); } }
  const module = { exports: {} };
  runInNewContext(bundle.outputFiles[0].text, {
    module, exports: module.exports,
    require: () => ({ Plugin, WorkspaceLeaf, WorkspaceTabs, WorkspaceWindow, View, Notice }),
    window: {
      requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
      cancelAnimationFrame(id) { frames.delete(id); },
    },
  });
  const plugin = new module.exports.default();
  plugin.app = { workspace: {
    rootSplit: root,
    onLayoutReady(callback) { if (ready) callback(); else readyCallback = callback; },
    on(event, callback) { layout.on(event, callback); return () => layout.off(event, callback); },
    iterateAllLeaves(callback) { groups.flatMap((group) => [...group.children]).forEach(callback); },
    getActiveViewOfType() { return activeLeaf ? { leaf: activeLeaf } : null; },
  } };
  return {
    plugin, notices, frames,
    group: (area) => new WorkspaceTabs(area),
    leaf: (name, group, pinned) => new WorkspaceLeaf(name, group, pinned),
    popout: () => new WorkspaceWindow(),
    activate(leaf) { activeLeaf = leaf; leaf.parent.currentTab = leaf.parent.children.indexOf(leaf); },
    ready() { readyCallback?.(); },
    flush() {
      let passes = 0;
      while (frames.size) {
        assert.ok(++passes < 10, "Normalization must settle without an event loop.");
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach((callback) => callback());
      }
    },
    unload() { plugin.onunload(); plugin.cleanups.forEach((dispose) => dispose()); },
  };
}

test("keeps stable order through the requested pin and unpin sequence", () => {
  const f = workspaceFixture();
  const group = f.group();
  const tabs = [1, 2, 3, 4].map((number) => f.leaf(`tab${number}`, group));
  f.activate(tabs[0]);
  f.plugin.onload(); f.flush();
  tabs[2].setPinned(true); f.flush();
  assert.deepEqual(group.children.map((leaf) => leaf.name), ["tab3", "tab1", "tab2", "tab4"]);
  tabs[1].setPinned(true); f.flush();
  assert.deepEqual(group.children.map((leaf) => leaf.name), ["tab3", "tab2", "tab1", "tab4"]);
  tabs[2].setPinned(false); f.flush();
  assert.deepEqual(group.children.map((leaf) => leaf.name), ["tab2", "tab3", "tab1", "tab4"]);
  assert.equal(group.children[group.currentTab], tabs[0]);
});

test("normalizes restored pins independently in main and popout groups", () => {
  const f = workspaceFixture();
  const first = f.group(); const second = f.group(f.popout());
  f.leaf("a", first); f.leaf("b", first, true);
  f.leaf("c", second); f.leaf("d", second, true);
  f.plugin.onload(); f.flush();
  assert.deepEqual(first.children.map((leaf) => leaf.name), ["b", "a"]);
  assert.deepEqual(second.children.map((leaf) => leaf.name), ["d", "c"]);
});

test("bulk unpin clears only the current group and preserves its order", () => {
  const f = workspaceFixture(); const current = f.group(); const other = f.group();
  const first = f.leaf("a", current, true);
  f.leaf("b", current, true); const ordinary = f.leaf("c", current);
  const foreign = f.leaf("d", other, true);
  f.activate(ordinary); f.plugin.onload(); f.flush();
  const before = [...current.children];
  assert.equal(f.plugin.command.checkCallback(false), true); f.flush();
  assert.equal(first.pinned, false);
  assert.ok(current.children.every((leaf) => !leaf.pinned));
  assert.deepEqual(current.children, before);
  assert.equal(foreign.pinned, true);
  assert.equal(current.children[current.currentTab], ordinary);
});

test("availability checks do not clear pins and disappear after bulk unpin", () => {
  const f = workspaceFixture(); const tab = f.leaf("a", f.group(), true);
  f.activate(tab); f.plugin.onload(); f.flush();
  assert.equal(f.plugin.command.checkCallback(true), true);
  assert.equal(tab.pinned, true);
  f.plugin.command.checkCallback(false); f.flush();
  assert.equal(f.plugin.command.checkCallback(true), false);
});

test("excludes sidebar groups from sorting and bulk unpin", () => {
  const f = workspaceFixture(); const sidebar = f.group({});
  f.leaf("a", sidebar); const pinned = f.leaf("b", sidebar, true);
  f.activate(pinned); f.plugin.onload(); f.flush();
  assert.deepEqual(sidebar.children.map((leaf) => leaf.name), ["a", "b"]);
  assert.equal(f.plugin.command.checkCallback(false), false);
  assert.equal(pinned.pinned, true);
});

test("skips an incompatible group and shows only one compatibility notice", () => {
  const f = workspaceFixture(); const group = f.group(); group.autoManageDOM = true;
  f.leaf("a", group); const pinned = f.leaf("b", group, true);
  f.plugin.onload(); f.flush(); pinned.setPinned(true); f.flush();
  assert.deepEqual(group.children.map((leaf) => leaf.name), ["a", "b"]);
  assert.equal(f.notices.length, 1);
});

test("unload cancels pending sorting and removes event subscriptions", () => {
  const f = workspaceFixture(); const group = f.group();
  f.leaf("a", group); const tab = f.leaf("b", group);
  f.plugin.onload(); f.flush(); tab.setPinned(true);
  f.unload(); f.flush(); tab.setPinned(false);
  assert.equal(f.frames.size, 0);
  assert.equal(tab.events.listenerCount("pinned-change"), 0);
  assert.equal(f.plugin.command.checkCallback(false), false);
});

test("does not register callbacks if unloaded before layout becomes ready", () => {
  const f = workspaceFixture({ ready: false }); const tab = f.leaf("a", f.group());
  f.plugin.onload(); f.unload(); f.ready();
  assert.equal(tab.events.listenerCount("pinned-change"), 0);
  assert.equal(f.frames.size, 0);
});
