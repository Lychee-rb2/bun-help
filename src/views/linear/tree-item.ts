import { iconMap, LINEAR_VIEW, openExternal, treeId } from "@/help";
import * as vscode from "vscode";
import { createBranch, sendPreview } from "./action";
import type { Attachment, Issue } from "./type";

export const assigneeTreeItemFrom = (issues: Issue[]) => {
  const assignees = Object.entries(
    issues.reduce<Record<string, { issues: Issue[] }>>((acc, issue) => {
      const name =
        (issue.assignee?.isMe ? "Me" : issue.assignee?.displayName) || "Others";
      acc[name] = acc[name] || { issues: [] };
      acc[name].issues.push(issue);
      return acc;
    }, {}),
  )
    .sort(([labelA], [labelB]) =>
      labelA === "Me" ? -1 : labelB === "Me" ? 1 : 0,
    )
    .map(([label, { issues }]) => assigneeTreeItem(label, issues));
  return assignees;
};
export const assigneeTreeItem = (label: string, issues: Issue[]) => {
  const treeItem = new vscode.TreeItem(
    label,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  treeItem.contextValue = treeId(LINEAR_VIEW, "assignee");
  return {
    treeItem,
    getChildren: () => issues.map((issue) => issueTreeItem(issue)),
  };
};

const issueStateMap = {
  unstarted: "unstarted",
  started: "started",
  completed: "completed",
  canceled: "canceled",
  backlog: "backlog",
} as const;
export const issueTreeItem = (issue: Issue) => {
  const treeItem = new vscode.TreeItem(
    `[${issue.identifier}]${issue.title}`,
    issue.attachments.nodes.length
      ? vscode.TreeItemCollapsibleState.Expanded
      : vscode.TreeItemCollapsibleState.None,
  );
  treeItem.contextValue = treeId(LINEAR_VIEW, "issue");
  const icon = issueStateMap[issue.state.type as keyof typeof issueStateMap];
  if (icon) {
    treeItem.iconPath = iconMap(icon);
  }
  return {
    treeItem,
    getChildren: () =>
      issue.attachments.nodes.map((attachment) =>
        pullRequestTreeItem(issue, attachment),
      ),
    openIssue: () => openExternal(issue.url),
    createBranch: () => createBranch(issue),
    issue,
  };
};

export const pullRequestTreeItem = (issue: Issue, attachment: Attachment) => {
  const treeItem = new vscode.TreeItem(attachment.metadata.title);
  treeItem.iconPath = iconMap(attachment.metadata.status);
  treeItem.contextValue = treeId(LINEAR_VIEW, "pull-request");
  return {
    treeItem,
    getChildren: () => [],
    sendPreview: () => sendPreview(issue, attachment),
    openPullRequest: () => openExternal(attachment.metadata.url),
  };
};
