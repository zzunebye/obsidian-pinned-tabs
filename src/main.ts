import { Plugin } from "obsidian";

import { PinController } from "./pin-controller";

export default class PinnedTabsPlugin extends Plugin {
  private pinController: PinController | undefined;

  override onload(): void {
    this.pinController = new PinController(this);
    this.pinController.start();
    this.addCommand({
      id: "unpin-all-tabs-in-current-group",
      name: "Unpin all tabs in current group",
      checkCallback: (checking) => this.pinController?.unpinCurrentGroup(checking) ?? false,
    });
  }

  override onunload(): void {
    this.pinController?.stop();
    this.pinController = undefined;
  }
}
