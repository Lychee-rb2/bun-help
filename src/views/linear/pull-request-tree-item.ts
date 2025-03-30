import { iconMap } from "@/help";
import { LINEAR_VIEW, treeId } from "@/help/const";
import * as vscode from "vscode";
import type { IssueTreeItem } from "./issue-tree-item";
import type { Attachment, Issue } from "./type";

export class PullRequestTreeItem extends vscode.TreeItem {
  contextValue = treeId(LINEAR_VIEW, "pull-request");
  constructor(
    public issue: Issue,
    public attachment: Attachment,
  ) {
    super(`${attachment.metadata.title}`, vscode.TreeItemCollapsibleState.None);
    this.iconPath = iconMap(attachment.metadata.status);
  }

  static from(issueTreeItem: IssueTreeItem) {
    return issueTreeItem.issue.attachments.nodes.map(
      (attachment) => new PullRequestTreeItem(issueTreeItem.issue, attachment),
    );
  }
}
