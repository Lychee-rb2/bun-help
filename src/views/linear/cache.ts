import type { Sdk } from "@/graphql/linear.client";
import * as vscode from "vscode";
import type { Issue } from "./type";

interface IssuesCache {
  issues: Issue[];
  t: number;
}
export class LinearIssuesCache {
  private cacheTime = 1000 * 60 * 30;
  private config = vscode.workspace.getConfiguration("lychee-quick");
  private cacheKey: string;
  public issues: IssuesCache["issues"] = [];
  constructor(
    public context: vscode.ExtensionContext,
    public client: Sdk,
  ) {
    this.cacheKey = `linearIssuesCache-${this.config.get<string>("linearTeam")}`;
  }

  private async fetchLinearIssues(): Promise<Issue[]> {
    const team = this.config.get<string>("linearTeam");
    if (!team) {
      throw new Error("Linear team is not set");
    }
    return this.client.issues({ team }).then((res) => res.issues.nodes);
  }
  async getIssue() {
    const cachedData = this.context.globalState.get<IssuesCache>(this.cacheKey);
    if (cachedData && Date.now() - cachedData.t < this.cacheTime) {
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
