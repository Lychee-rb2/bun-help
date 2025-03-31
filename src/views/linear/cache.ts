import type { Sdk } from "@/graphql/linear.client";
import { EXTENSION } from "@/help";
import { cacheClient, type Cache } from "@/help/cache";
import * as vscode from "vscode";
import type { Issue } from "./type";

export class LinearIssuesCache {
  private cacheTime = 1000 * 60 * 30;
  private config = vscode.workspace.getConfiguration(EXTENSION);
  private cacheKey: string;
  private cache: Promise<Cache<Issue[]>>;
  constructor(
    public context: vscode.ExtensionContext,
    public client: Sdk,
  ) {
    this.cacheKey = `linear-${this.config.get<string>("linearTeam")}`;
    this.cache = cacheClient(this.context, this.cacheTime, () =>
      this.fetchLinearIssues(),
    );
  }

  private async fetchLinearIssues(): Promise<Issue[]> {
    const team = this.config.get<string>("linearTeam");
    if (!team) throw new Error("Linear team is not set");
    return this.client.issues({ team }).then((res) => res.issues.nodes);
  }
  async getIssues() {
    return (await this.cache).get(this.cacheKey);
  }

  async clear() {
    return (await this.cache).remove(this.cacheKey);
  }
}
