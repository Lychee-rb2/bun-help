import { createClient } from "@/fetch/linear";
import { EXTENSION } from "@/help";
import { type Cache, cacheClient } from "@/help/cache";
import * as vscode from "vscode";
import type { Issue } from "./type";

export const linearIssuesCache = (): Cache<Issue[]> => {
  const config = vscode.workspace.getConfiguration(EXTENSION);
  const cacheKey = `linear-${config.get<string>("linearTeam")}`;

  const cache = cacheClient(1000 * 60 * 30, async () => {
    const team = config.get<string>("linearTeam");
    const apiKey = config.get<string>("linearApiKey");
    if (!team) throw new Error("Linear team is not set");
    if (!apiKey) throw new Error("Linear api key is not set");
    return createClient(apiKey)
      .issues({ team })
      .then((res) => res.issues.nodes);
  });
  let issues: Issue[] = [];
  return {
    get: async () => {
      if (issues.length) return issues;
      issues = await cache.then((cache) => cache.get(cacheKey));
      return issues;
    },
    remove: async () => {
      issues = [];
      return cache.then((cache) => cache.remove(cacheKey));
    },
  };
};
