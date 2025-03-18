import { getCycleIssues } from "@/fetch/linear";
import { type Issue, type WorkflowState } from "@linear/sdk";
import { format } from "date-fns";
import * as vscode from "vscode";
import { findNextBranch } from "../help/git";
import { cli } from "../help/io";

const groups = ["My Issues", "Others"] as const;
interface IssuesCache {
  issues: { issue: Issue; state: WorkflowState }[];
  t: number;
}

export class LinearIssuesCache {
  constructor(
    public linearTeam: string,
    public globalState: vscode.Memento,
    public linearApiKey: string,
  ) {}

  private cacheKey(group: (typeof groups)[number]) {
    return `linearIssuesCache-${this.linearTeam}-${group}`;
  }

  private async fetchLinearIssues(
    group?: "My Issues" | "Others",
  ): Promise<IssuesCache["issues"]> {
    if (!group) {
      return [];
    }
    const issues = await getCycleIssues({
      team: this.linearTeam,
      apiKey: this.linearApiKey,
      isMe: group === "My Issues",
    });
    return Promise.all(
      issues
        .filter((i) => i.state)
        .map((issue) => issue.state!.then((state) => ({ issue, state }))),
    );
  }

  async get(group: (typeof groups)[number]) {
    const cacheKey = this.cacheKey(group);
    const cachedData = this.globalState.get<IssuesCache>(cacheKey);
    if (cachedData && Date.now() - cachedData.t < 1000 * 60 * 60 * 24) {
      return cachedData;
    }
    const data = {
      issues: await this.fetchLinearIssues(group),
      t: Date.now(),
    } satisfies IssuesCache;
    await this.globalState.update(cacheKey, data);
    return data;
  }

  async clear(group: (typeof groups)[number]) {
    const cacheKey = this.cacheKey(group);
    await this.globalState.update(cacheKey, undefined);
  }

  async clearAll() {
    await Promise.all(groups.map((group) => this.clear(group)));
  }
}

export class LinearTreeGroup extends vscode.TreeItem {
  constructor(
    public group: (typeof groups)[number],
    public data: IssuesCache,
  ) {
    super(group, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "lychee-quick.linearViewGroup";
    if (data?.t) {
      this.tooltip = `Last updated at ${format(data.t, "yyyy-MM-dd HH:mm:ss")}`;
    }
  }
}

export class LinearTreeItem extends vscode.TreeItem {
  constructor(
    public issue: Issue,
    public label: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
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
  linearCache: LinearIssuesCache;
  dispose: vscode.Disposable;
  constructor(
    public linearApiKey: string,
    public linearTeam: string,
    public globalState: vscode.Memento,
  ) {
    this.linearCache = new LinearIssuesCache(
      this.linearTeam,
      this.globalState,
      this.linearApiKey,
    );
    this.dispose = vscode.window.registerTreeDataProvider(
      "lychee-quick.linearView",
      this,
    );
    vscode.commands.registerCommand(
      "lychee-quick.openIssue",
      (item: LinearTreeItem) => {
        vscode.env.openExternal(vscode.Uri.parse(item.issue.url));
      },
    );

    vscode.commands.registerCommand(
      "lychee-quick.checkBranch",
      async (item: LinearTreeItem) => {
        const branchName = await findNextBranch(item.issue.branchName);
        await cli(["git", "checkout", "main"]);
        await cli(["git", "pull"]);
        await cli(["git", "checkout", "-b", branchName]);
        await vscode.window.showInformationMessage(
          `Checkout branch ${branchName} success`,
        );
      },
    );
    vscode.commands.registerCommand("lychee-quick.refreshLinear", async () => {
      this.refresh();
    });
  }

  async getTreeItem(element: LinearTreeItem | LinearTreeGroup) {
    return element;
  }

  async getChildren(
    element?: LinearTreeItem,
  ): Promise<(LinearTreeItem | LinearTreeGroup)[]> {
    if (!this.linearApiKey || !this.linearTeam) {
      return [];
    }
    if (!element) {
      return Promise.all(groups.map((group) => this.createGroup(group)));
    }
    if (element instanceof LinearTreeGroup) {
      return Promise.all(
        element.data.issues.map(({ issue, state }) =>
          this.createTreeItem(issue, state),
        ),
      );
    }
    return [];
  }
  private async createGroup(group: (typeof groups)[number]) {
    const data = await this.linearCache.get(group);
    return new LinearTreeGroup(group, data);
  }
  private async createTreeItem(issue: Issue, state: WorkflowState) {
    const map: Record<string, string> = {
      unstarted: "⚪",
      started: "🟠",
      completed: "🟢",
    };
    const label = `${map[state?.type ?? "unstarted"]} [${issue.identifier}]${issue.title}`;
    return new LinearTreeItem(issue, label);
  }

  refresh(): void {
    this.linearCache.clearAll();
    this._onDidChangeTreeData.fire(undefined);
  }
}
