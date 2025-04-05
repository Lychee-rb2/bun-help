import { createClient } from "@/fetch/linear";
import { cli, findNextBranch, getConfig, openExternal } from "@/help";
import { format } from "date-fns";
import * as vscode from "vscode";
import { z } from "zod";
import { buildCommentBody } from "./linear-body";
import type { Attachment, Issue } from "./type";

export const sendPreview = async (issue: Issue, attachment: Attachment) => {
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
    attachment.metadata.previewLinks,
    config.get<string>("previewsCommentFooter"),
  );

  const answer = await vscode.window.showInformationMessage(
    `Do you want to send preview comment to Linear issue ${issue.identifier}?`,
    {
      modal: true,
      detail: JSON.stringify(body.markdown),
    },
    "Yes",
  );
  if (!answer) return;
  const res = await client.createComment({
    input: { issueId: issue.id, bodyData: body.linear },
  });
  openExternal(res.commentCreate.comment.url);
  await vscode.window.showInformationMessage(
    `Send preview to ${emails.join(",")} success`,
  );
};

export const releaseIssues = async (items: Issue[]) => {
  if (items.length === 0) return;
  const content = [
    `# Release note: ${format(new Date(), "yyyy-MM-dd")}`,
    items
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(({ identifier, url, attachments, title }) => ({
        title: `${identifier} ${title}`,
        url: url,
        prs: attachments.nodes.map(({ metadata: { title, url } }) => ({
          title,
          url,
        })),
      }))
      .map(({ title, url, prs }) =>
        [
          `## [${title}](${url})`,
          prs.map(({ title, url }) => `- [${title}](${url})`).join("\n"),
        ].join("\n"),
      )
      .join("\n"),
  ].join("\n");
  await vscode.env.clipboard.writeText(content);
  await vscode.window.showInformationMessage("已复制到剪贴板");
};

export const createBranch = async (issue: Issue) => {
  const branchName = await findNextBranch(issue.branchName);
  await cli(["git", "checkout", "main"]);
  await cli(["git", "pull"]);
  await cli(["git", "checkout", "-b", branchName]);
  await vscode.window.showInformationMessage(
    `Checkout branch ${branchName} success`,
  );
};
