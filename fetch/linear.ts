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
