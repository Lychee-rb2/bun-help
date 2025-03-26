import { LINEAR_VIEW, openExternal, register } from "../help";

import type { Sdk } from "graphql/linear/client";
import * as vscode from "vscode";

import { createClient } from "../fetch/client";
import { checkBranch, releaseIssues, sendPreview } from "./linear/action";
import { AssigneeTreeItem } from "./linear/assignee-tree-item";
import { LinearIssuesCache } from "./linear/cache";
import { IssueTreeItem } from "./linear/issue-tree-item";
import { PullRequestTreeItem } from "./linear/pull-request-tree-item";

type TreeItem = IssueTreeItem | AssigneeTreeItem | PullRequestTreeItem;

export class LinearTreeDataProvider
  implements vscode.TreeDataProvider<TreeItem>
{
  readonly id = LINEAR_VIEW;
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> =
    new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event;
  private cache: LinearIssuesCache;

  private isReleaseCheckboxEnabled = false;
  private selectedItems: Set<IssueTreeItem> = new Set();
  private _onDidChangeCheckboxState = new vscode.EventEmitter<
    vscode.TreeCheckboxChangeEvent<IssueTreeItem>
  >();

  readonly onDidChangeCheckboxState = this._onDidChangeCheckboxState.event;

  private client: Sdk;
  private register = (
    command: string,
    callback: Parameters<typeof register>[1],
  ) => {
    register(`${this.id}.${command}`, callback);
  };
  constructor(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration("lychee-quick");
    this.client = createClient(config.linearApiKey);
    this.cache = new LinearIssuesCache(context, this.client);

    const view = vscode.window.createTreeView(`lychee-quick.${this.id}`, {
      treeDataProvider: this,
      manageCheckboxStateManually: true,
    });

    view.onDidChangeCheckboxState((event) => {
      event.items.forEach(([item, state]) => {
        if (item instanceof IssueTreeItem) {
          if (state === vscode.TreeItemCheckboxState.Checked) {
            this.selectedItems.add(item);
          } else {
            this.selectedItems.delete(item);
          }
        }
      });
    });
    this.initCommands();
  }

  private initCommands() {
    this.register("open-issue", (item: IssueTreeItem) =>
      openExternal(item.issue.url),
    );
    this.register("check-branch", (item: IssueTreeItem) => checkBranch(item));
    this.register("refresh", () => this.refresh());
    this.register("send-preview", (item: PullRequestTreeItem) =>
      sendPreview(item),
    );
    this.register("release-issues", () => this.releaseIssues());
    this.register("open-pull-request", (item: PullRequestTreeItem) =>
      openExternal(item.attachment.metadata.url),
    );
  }

  async getTreeItem(element: TreeItem) {
    return element;
  }

  async getChildren(
    element?: AssigneeTreeItem | IssueTreeItem,
  ): Promise<TreeItem[]> {
    if (!element) {
      const issues = await this.cache.getIssue();
      return AssigneeTreeItem.from(issues);
    }
    if (element instanceof AssigneeTreeItem) {
      return element.getChildren(this.isReleaseCheckboxEnabled);
    }
    return element.getChildren();
  }

  refresh(): void {
    this.cache.clear();
    this._onDidChangeTreeData.fire(undefined);
  }

  async releaseIssues(): Promise<void> {
    switch (this.isReleaseCheckboxEnabled) {
      case true: {
        releaseIssues(this.selectedItems);
        break;
      }
    }
    this.isReleaseCheckboxEnabled = !this.isReleaseCheckboxEnabled;
    this.selectedItems.clear();
    this._onDidChangeTreeData.fire(undefined);
  }
}
