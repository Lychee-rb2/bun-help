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
