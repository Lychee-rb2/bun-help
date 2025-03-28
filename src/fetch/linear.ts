import { GraphQLClient } from "graphql-request";
import { getSdk, type Sdk } from "graphql/linear/client";
let client: Sdk | null = null;

export const createClient = (key?: string): Sdk => {
  if (client) return client;
  client = getSdk(
    new GraphQLClient("https://api.linear.app/graphql", {
      headers: key ? { Authorization: `${key}` } : {},
    }),
  );
  return client;
};
