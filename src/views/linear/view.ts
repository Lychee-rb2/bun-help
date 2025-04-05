import {
  EXTENSION,
  LINEAR_VIEW,
  onViewCheckboxStateChange,
  register,
  treeId,
} from "@/help";

import * as vscode from "vscode";

import type { Cache } from "@/help/cache";
import { releaseIssues } from "@/views/linear/action";

import { linearIssuesCache } from "./cache";
import {
  assigneeTreeItem,
  assigneeTreeItemFrom,
  issueTreeItem,
  pullRequestTreeItem,
} from "./tree-item";
import type { Issue } from "./type";

type IssueTreeItem = ReturnType<typeof issueTreeItem>;
type AssigneeTreeItem = ReturnType<typeof assigneeTreeItem>;
type PullRequestTreeItem = ReturnType<typeof pullRequestTreeItem>;
type TreeItem = AssigneeTreeItem | IssueTreeItem | PullRequestTreeItem;

export class LinearTreeDataProvider
  implements vscode.TreeDataProvider<TreeItem>
{
  public releaseCheckbox = false;
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> =
    new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(public cache: Cache<Issue[]>) {}

  getTreeItem(item: TreeItem) {
    if (
      item.treeItem.contextValue === treeId(LINEAR_VIEW, "issue") &&
      this.releaseCheckbox
    ) {
      item.treeItem.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
    }
    return item.treeItem;
  }

  async getChildren(item?: TreeItem): Promise<TreeItem[]> {
    const issues = await this.cache.get();
    if (!item) {
      return assigneeTreeItemFrom(issues);
    }
    return item.getChildren();
  }

  public async refresh() {
    await this.cache.remove();
    this._onDidChangeTreeData.fire(undefined);
  }
  public async releaseIssues(selectedItems: Issue[]) {
    switch (this.releaseCheckbox) {
      case true: {
        await releaseIssues(selectedItems);
        break;
      }
    }
    this.releaseCheckbox = !this.releaseCheckbox;
    this._onDidChangeTreeData.fire(undefined);
  }
}

export const linearView = () => {
  const cmd = (cmd: string) => `${LINEAR_VIEW}.${cmd}`;
  const selectedItems = new Set<Issue>();
  const cache = linearIssuesCache();
  const treeDataProvider = new LinearTreeDataProvider(cache);
  const view = vscode.window.createTreeView(`${EXTENSION}.${LINEAR_VIEW}`, {
    treeDataProvider,
    manageCheckboxStateManually: true,
  });
  onViewCheckboxStateChange<TreeItem, IssueTreeItem>(
    view,
    (item) => selectedItems.add(item.issue),
    (item) => selectedItems.delete(item.issue),
    (item) => item.treeItem.contextValue === treeId(LINEAR_VIEW, "issue"),
  );
  register<IssueTreeItem>(cmd(`open-issue`), (item) => item.openIssue());
  register<IssueTreeItem>(cmd("create-branch"), (item) => item.createBranch());
  register(cmd("refresh"), () => treeDataProvider.refresh());
  register(cmd("release-issues"), async () => {
    await treeDataProvider.releaseIssues(Array.from(selectedItems));
    selectedItems.clear();
  });
  register<PullRequestTreeItem>(cmd("send-preview"), (item) =>
    item.sendPreview(),
  );
  register<PullRequestTreeItem>(cmd("open-pull-request"), (item) =>
    item.openPullRequest(),
  );
};
