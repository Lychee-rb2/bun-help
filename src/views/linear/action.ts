import { cli, findNextBranch, getConfig, openExternal } from "@/src/help";
import { createClient } from "@@/fetch/linear";
import { format } from "date-fns";
import * as vscode from "vscode";
import { z } from "zod";
import type { IssueTreeItem } from "./issue-tree-item";
import { buildCommentBody } from "./linear-body";
import type { PullRequestTreeItem } from "./pull-request-tree-item";

export const sendPreview = async (item: PullRequestTreeItem) => {
  const config = getConfig();
  const client = createClient(config.get<string>("linearApiKey"));

  const emails =
    config
      .get<string[]>("previewsCommentMentions")
      ?.map((i) => z.string().email().safeParse(i.trim()))
      ?.filter((i) => i.success)
      ?.map((i) => i.data) || [];

  const mensions = await client
    .users({ filter: { email: { in: emails } } })
    .then((res) => res.users.nodes.map((i) => ({ id: i.id, label: i.name })));

  const body = buildCommentBody(
    mensions,
    item.attachment.metadata.previewLinks,
    config.get<string>("previewsCommentFooter"),
  );
  const answer = await vscode.window.showInformationMessage(
    "Do you want to do this?",
    {
      modal: true,
      detail: JSON.stringify(body.markdown),
    },
    "Yes",
  );
  if (!answer) return;
  const res = await client.createComment({
    input: { issueId: item.issue.id, bodyData: body.linear },
  });
  openExternal(res.commentCreate.comment.url);
  await vscode.window.showInformationMessage(
    `Send preview to ${emails.join(",")} success`,
  );
};

export const releaseIssues = async (items: Set<IssueTreeItem>) => {
  if (items.size === 0) return;
  const content = [
    `# Release note: ${format(new Date(), "yyyy-MM-dd")}`,
    [...items]
      .map((i) => ({
        title: i.issue.identifier + " " + i.issue.title,
        url: i.issue.url,
        prs: i.issue.attachments.nodes.map((a) => ({
          title: a.metadata.title,
          url: a.metadata.url,
        })),
      }))
      .map((i) =>
        [
          `## [${i.title}](${i.url})`,
          i.prs.map((pr) => `- [${pr.title}](${pr.url})`).join("\n"),
        ].join("\n"),
      )
      .join("\n"),
  ].join("\n");
  await vscode.env.clipboard.writeText(content);
  await vscode.window.showInformationMessage("已复制到剪贴板");
};

export const checkBranch = async (item: IssueTreeItem) => {
  const branchName = await findNextBranch(item.issue.branchName);
  await cli(["git", "checkout", "main"]);
  await cli(["git", "pull"]);
  await cli(["git", "checkout", "-b", branchName]);
  await vscode.window.showInformationMessage(
    `Checkout branch ${branchName} success`,
  );
};
