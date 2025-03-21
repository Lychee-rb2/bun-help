import { buildCommentBody } from "@/src/help/linear-body";
import type { GithubAttachmentMeta } from "@/types/linear";
import { LinearClient } from "@linear/sdk";
export enum PaginationSortOrder {
  Ascending = "Ascending",
  Descending = "Descending",
}
export const getIssue = async ({
  team,
  number,
  apiKey,
}: {
  team: string;
  number: number;
  apiKey: string;
}) => {
  const client = new LinearClient({ apiKey });
  const res = await client.issues({
    filter: { team: { name: { eq: team } }, number: { eq: number } },
  });
  return res.nodes.at(0);
};

export const getIssues = async ({
  team,
  numbers,
  apiKey,
}: {
  team: string;
  numbers: number[];
  apiKey: string;
}) => {
  const client = new LinearClient({ apiKey });
  const res = await client.issues({
    filter: { team: { name: { eq: team } }, number: { in: numbers } },
    first: 200,
  });
  return res.nodes;
};

export const getCycleIssues = async ({
  team,
  apiKey,
  isMe,
}: {
  team: string;
  apiKey: string;
  isMe: boolean;
}) => {
  const client = new LinearClient({ apiKey });
  return await client
    .issues({
      sort: {
        workflowState: {
          order: PaginationSortOrder.Ascending,
        },
      },
      filter: {
        team: { name: { eq: team } },
        assignee: isMe
          ? { isMe: { eq: isMe } }
          : { or: [{ isMe: { eq: false } }, { null: true }] },
        cycle: { isActive: { eq: true } },
        state: { type: { in: ["unstarted", "started", "completed"] } },
      },
      first: 200,
    })
    .then((res) => res.nodes);
};

export const createPreviewsComment = async ({
  issueId,
  apiKey,
  emails,
  previews,
  footer,
}: {
  issueId: string;
  emails: string[];
  previews: GithubAttachmentMeta["previewLinks"];
  apiKey: string;
  footer?: string;
}) => {
  const client = new LinearClient({ apiKey });
  const mensions = await client
    .users({ filter: { email: { in: emails } } })
    .then((res) => res.nodes);
  return await client.createComment({
    issueId,
    bodyData: buildCommentBody(
      mensions.map((i) => ({ id: i.id, label: i.name })),
      previews,
      footer,
    ),
  });
};
