import type { Sdk } from "@/graphql/linear/client";
import * as vscode from "vscode";
import type { Issue } from "./type";

interface IssuesCache {
  issues: Issue[];
  t: number;
}

export class LinearIssuesCache {
  private config = vscode.workspace.getConfiguration("lychee-quick");
  private cacheKey: string;
  public issues: IssuesCache["issues"] = [];
  constructor(
    public context: vscode.ExtensionContext,
    public client: Sdk,
  ) {
    this.cacheKey = `linearIssuesCache-${this.config.linearTeam}`;
  }

  private async fetchLinearIssues(): Promise<Issue[]> {
    return this.client
      .issues({ team: this.config.linearTeam })
      .then((res) => res.issues.nodes);
  }
  async getIssue() {
    const cachedData = this.context.globalState.get<IssuesCache>(this.cacheKey);
    if (cachedData && Date.now() - cachedData.t < 1000 * 60 * 60 * 24) {
      return cachedData.issues;
    }
    const data = {
      issues: await this.fetchLinearIssues(),
      t: Date.now(),
    } satisfies IssuesCache;
    this.issues = data.issues;
    await this.context.globalState.update(this.cacheKey, data);
    return data.issues;
  }

  async clear() {
    await this.context.globalState.update(this.cacheKey, undefined);
  }
}
