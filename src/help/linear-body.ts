import type { GithubAttachmentMeta } from "@/types/linear";

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
    type: "doc",
    content: [
      ...buildHello(mentions),
      buildPreviews(previews),
      ...(footer ? buildFooter(footer) : []),
    ],
  };
};
