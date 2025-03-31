import { iconMap } from "@/help";
import { LINEAR_VIEW, treeId } from "@/help/const";
import * as vscode from "vscode";
import type { AssigneeTreeItem } from "./assignee-tree-item";
import { PullRequestTreeItem } from "./pull-request-tree-item";
import type { Issue } from "./type";
import type { LinearTreeDataProvider } from "./view";

const issueStateMap = {
  unstarted: "unstarted",
  started: "started",
  completed: "completed",
  canceled: "canceled",
  backlog: "backlog",
} as const;

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
    const icon = issueStateMap[issue.state.type as keyof typeof issueStateMap];
    if (icon) {
      this.iconPath = iconMap(icon);
    }
  }

  static from(
    assigneeTreeItem: AssigneeTreeItem,
    isReleaseCheckboxEnabled: boolean,
  ) {
    return assigneeTreeItem.issues.map(
      (issue) => new IssueTreeItem(issue, isReleaseCheckboxEnabled),
    );
  }

  getChildren(_: LinearTreeDataProvider) {
    return PullRequestTreeItem.from(this);
  }
}
