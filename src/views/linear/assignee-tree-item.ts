import { LINEAR_VIEW, treeId } from "@/src/help/const";
import * as vscode from "vscode";
import { IssueTreeItem } from "./issue-tree-item";
import type { Issue } from "./type";

export class AssigneeTreeItem extends vscode.TreeItem {
  static MyIssues = "My issues";
  static Others = "Others";
  contextValue = treeId(LINEAR_VIEW, "assignee");
  constructor(
    public label: string,
    public issues: Issue[],
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
  }

  static from(issues: Issue[]) {
    return Object.entries(
      issues.reduce<Record<string, { issues: Issue[] }>>((acc, issue) => {
        const name =
          (issue.assignee?.isMe
            ? AssigneeTreeItem.MyIssues
            : issue.assignee?.displayName) || AssigneeTreeItem.Others;
        acc[name] = acc[name] || { issues: [] };
        acc[name].issues.push(issue);
        return acc;
      }, {}),
    )
      .sort(([labelA], [labelB]) =>
        labelA === AssigneeTreeItem.MyIssues
          ? -1
          : labelB === AssigneeTreeItem.MyIssues
            ? 1
            : 0,
      )
      .map(([label, { issues }]) => new AssigneeTreeItem(label, issues));
  }

  getChildren(isReleaseCheckboxEnabled: boolean) {
    return IssueTreeItem.from(this, isReleaseCheckboxEnabled);
  }
}
