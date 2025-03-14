import { getCycleIssues } from "@/fetch/linear";
import { type Issue } from "@linear/sdk";
import { format } from "date-fns";
import * as vscode from "vscode";
export class LinearTreeGroup extends vscode.TreeItem {
  constructor(
    public title: string,
    public t?: number,
  ) {
    super(title, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "lychee-quick.linearViewGroup";
    if (t) {
      this.tooltip = `Last updated at ${format(t, "yyyy-MM-dd HH:mm:ss")}`;
    }
  }
}

export class LinearTreeItem extends vscode.TreeItem {
  constructor(
    public issue: Issue,
    public label: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.initialize();
  }
  private initialize() {
    this.command = {
      command: "lychee-quick.openIssue",
      title: "Open Issue",
      arguments: [this.issue.url],
    };
    this.contextValue = "lychee-quick.linearViewItem";
  }
}

export class LinearTreeDataProvider
  implements vscode.TreeDataProvider<LinearTreeItem | LinearTreeGroup>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    LinearTreeItem | LinearTreeGroup | undefined
  > = new vscode.EventEmitter<LinearTreeItem | LinearTreeGroup | undefined>();
  readonly onDidChangeTreeData: vscode.Event<
    LinearTreeItem | LinearTreeGroup | undefined
  > = this._onDidChangeTreeData.event;

  constructor(
    public linearApiKey: string,
    public linearTeam: string,
    public globalState: vscode.Memento,
  ) {}

  async getTreeItem(element: LinearTreeItem | LinearTreeGroup) {
    return element;
  }

  async getChildren(
    element?: LinearTreeItem,
  ): Promise<(LinearTreeItem | LinearTreeGroup)[]> {
    if (!this.linearApiKey || !this.linearTeam) {
      return [];
    }
    const cacheKey = `linearIssuesCache-${this.linearTeam}`;
    const cachedData = this.globalState.get<{
      treeItems: LinearTreeItem[];
      t: number;
    }>(cacheKey);
    if (!element) {
      return [
        new LinearTreeGroup("My Issues", cachedData?.t),
        new LinearTreeGroup("Others", cachedData?.t),
      ];
    }
    if (element instanceof LinearTreeGroup) {
      if (cachedData && Date.now() - cachedData.t < 1000 * 60 * 60 * 24) {
        return cachedData.treeItems;
      }
      const issues = await this.fetchLinearIssues(
        element.label as "My Issues" | "Others",
      );
      await this.globalState.update(cacheKey, {
        treeItems: issues,
        t: Date.now(),
      });
      return issues;
    }
    return [];
  }
  private async createTreeItem(issue: Issue) {
    const status = await issue.state;
    const map: Record<string, string> = {
      unstarted: "⚪",
      started: "🟠",
      completed: "🟢",
    };
    const label = `${map[status?.type ?? "unstarted"]} [${issue.identifier}]${issue.title}`;
    return new LinearTreeItem(issue, label);
  }
  private async fetchLinearIssues(
    group?: "My Issues" | "Others",
  ): Promise<LinearTreeItem[]> {
    if (!group) {
      return [];
    }
    const issues = await getCycleIssues({
      team: this.linearTeam,
      apiKey: this.linearApiKey,
      isMe: group === "My Issues",
    });
    return Promise.all(issues.map((issue) => this.createTreeItem(issue)));
  }

  refresh(): void {
    this.globalState.update(`linearIssuesCache-${this.linearTeam}`, undefined);
    this._onDidChangeTreeData.fire(undefined);
  }
}
