import type { Attachment, Issue } from "@@/types/linear";
import { createClient } from "@@/fetch/linear.ts";
import { z } from "zod";
import type { GithubAttachmentMeta } from "@/types/linear";
import { confirm } from "@inquirer/prompts";
import { $ } from "bun";
import { format } from "date-fns";
import { pbcopy } from "@@/help/io.ts";
import { logger } from "@@/help/logger.ts";

const buildMention = (mention: { id: string; label: string }) => ({
  type: "suggestion_userMentions",
  attrs: { id: mention.id, label: mention.label },
});
const buildHello = (mentions: { id: string; label: string }[]) => [
  {
    type: "paragraph",
    content: [
      { type: "text", text: "Hello " },
      ...mentions.map(buildMention),
      { type: "text", text: ", preview links👇" },
    ],
  },
  { type: "horizontal_rule" },
];

const buildPreviews = (
  previews: Pick<
    GithubAttachmentMeta["previewLinks"][number],
    "url" | "name"
  >[],
) => ({
  type: "bullet_list",
  content: previews.map((preview) => ({
    type: "list_item",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              {
                type: "link",
                attrs: {
                  href: preview.url,
                },
              },
            ],
            text: preview.name,
          },
        ],
      },
    ],
  })),
});
const buildFooter = (footer: string) => [
  { type: "horizontal_rule" },
  {
    type: "paragraph",
    content: [{ type: "text", text: footer }],
  },
];
export const buildCommentBody = (
  mentions: { id: string; label: string }[],
  previews: Pick<
    GithubAttachmentMeta["previewLinks"][number],
    "url" | "name"
  >[],
  footer?: string,
) => {
  return {
    linear: {
      type: "doc",
      content: [
        ...buildHello(mentions),
        buildPreviews(previews),
        ...(footer ? buildFooter(footer) : []),
      ],
    },
    markdown: [
      `# Hello ${mentions.map((i) => i.label).join(",")}, preview links👇`,
      `---`,
      ...previews.map((i) => `- [${i.name}](${i.url})`),
      ...(footer ? [`---`, footer] : []),
    ],
  };
};

export const sendPreview = async (issue: Issue, attachment: Attachment) => {
  const client = createClient();
  const previewsCommentMentions = (
    Bun.env.PREVIEWS_COMMENT_MENTIONS || ""
  ).split(",");
  const emails =
    previewsCommentMentions
      ?.map((i) => z.string().email().safeParse(i.trim()))
      ?.filter((i) => i.success)
      ?.map((i) => i.data) || [];

  const mentions = await client
    .users({ filter: { email: { in: emails } } })
    .then((res) => res.users.nodes.map((i) => ({ id: i.id, label: i.name })));

  const body = buildCommentBody(
    mentions,
    attachment.metadata.previewLinks,
    Bun.env.PREVIEWS_COMMENT_FOOTER,
  );
  body.markdown.forEach((i) => console.log(i));
  const answer = await confirm({
    message: `Do you want to send preview comment to Linear issue ${issue.identifier}?`,
  });
  if (!answer) return;
  const res = await client.createComment({
    input: { issueId: issue.id, bodyData: body.linear },
  });
  await $`open ${res.commentCreate.comment.url}`;
};

export const releaseIssues = (items: Issue[]) => {
  if (items.length === 0) return;
  const today = format(new Date(), "yyyy-MM-dd");
  const markdown = [
    "",
    `# Release note: ${today}`,
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
  pbcopy(markdown);
  logger.info(markdown);
};
