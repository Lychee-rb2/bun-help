import { iconMap } from "@/src/help";
import { LINEAR_VIEW, treeId } from "@/src/help/const";
import * as vscode from "vscode";
import type { AssigneeTreeItem } from "./assignee-tree-item";
import { PullRequestTreeItem } from "./pull-request-tree-item";
import type { Issue } from "./type";

export class IssueTreeItem extends vscode.TreeItem {
  contextValue = treeId(LINEAR_VIEW, "issue");
  constructor(
    public issue: Issue,
    public isReleaseCheckboxEnabled: boolean,
  ) {
    super(
      `[${issue.identifier}]${issue.title}`,
      issue.attachments.nodes.length
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );
    if (isReleaseCheckboxEnabled) {
      this.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
    }
    this.iconPath = iconMap(issue.state.type);
  }

  static from(
    assigneeTreeItem: AssigneeTreeItem,
    isReleaseCheckboxEnabled: boolean,
  ) {
    return assigneeTreeItem.issues.map(
      (issue) => new IssueTreeItem(issue, isReleaseCheckboxEnabled),
    );
  }

  getChildren() {
    return PullRequestTreeItem.from(this);
  }
}
