import { createPreviewsComment, getCycleIssues } from "@/fetch/linear";
import { type Attachment, type Issue, type WorkflowState } from "@linear/sdk";
import { format } from "date-fns";
import * as vscode from "vscode";
import { z } from "zod";
import { findNextBranch } from "../help/git";
import { cli } from "../help/io";

const groups = ["My Issues", "Others"] as const;
interface IssuesCache {
  issues: {
    issue: Issue;
    state: WorkflowState;
    attachments: Attachment[];
  }[];
  t: number;
}

export class LinearIssuesCache {
  private config = vscode.workspace.getConfiguration("lychee-quick");
  constructor(public context: vscode.ExtensionContext) {}

  private cacheKey(group: (typeof groups)[number]) {
    return `linearIssuesCache-${this.config.linearTeam}-${group}`;
  }

  private async fetchLinearIssues(
    group?: "My Issues" | "Others",
  ): Promise<IssuesCache["issues"]> {
    if (!group) {
      return [];
    }
    const issues = await getCycleIssues({
      team: this.config.linearTeam,
      apiKey: this.config.linearApiKey,
      isMe: group === "My Issues",
    });
    return Promise.all(
      issues
        .filter((i) => i.state)
        .map(async (issue) => {
          const state = await issue.state!;
          const attachments = (
            await issue.attachments({
              filter: { sourceType: { eq: "github" } },
            })
          ).nodes;
          return { issue, state, attachments };
        }),
    );
  }

  async get(group: (typeof groups)[number]) {
    const cacheKey = this.cacheKey(group);
    const cachedData = this.context.globalState.get<IssuesCache>(cacheKey);
    if (cachedData && Date.now() - cachedData.t < 1000 * 60 * 60 * 24) {
      return cachedData;
    }
    const data = {
      issues: await this.fetchLinearIssues(group),
      t: Date.now(),
    } satisfies IssuesCache;
    await this.context.globalState.update(cacheKey, data);
    return data;
  }

  async clear(group: (typeof groups)[number]) {
    const cacheKey = this.cacheKey(group);
    await this.context.globalState.update(cacheKey, undefined);
  }

  async clearAll() {
    await Promise.all(groups.map((group) => this.clear(group)));
  }
}
export class LinearPullRequestTreeItem extends vscode.TreeItem {
  constructor(
    public issue: Issue,
    public attachment: Attachment,
    public label: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "lychee-quick.linearPullRequestTreeItem";
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
    public attachments: Attachment[],
  ) {
    super(
      label,
      attachments.length
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );
    this.contextValue = "lychee-quick.linearViewItem";
  }
}

export class LinearTreeDataProvider
  implements
    vscode.TreeDataProvider<
      LinearTreeItem | LinearTreeGroup | LinearPullRequestTreeItem
    >
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    LinearTreeItem | LinearTreeGroup | LinearPullRequestTreeItem | undefined
  > = new vscode.EventEmitter<
    LinearTreeItem | LinearTreeGroup | LinearPullRequestTreeItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<
    LinearTreeItem | LinearTreeGroup | LinearPullRequestTreeItem | undefined
  > = this._onDidChangeTreeData.event;
  private cache: LinearIssuesCache;
  public dispose: vscode.Disposable;
  private config = vscode.workspace.getConfiguration("lychee-quick");

  constructor(context: vscode.ExtensionContext) {
    this.cache = new LinearIssuesCache(context);
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

    vscode.commands.registerCommand(
      "lychee-quick.sendPreview",
      async (item: LinearPullRequestTreeItem) => {
        const emails =
          this.config
            .get<string[]>("previewsCommentMentions")
            ?.map((i) => z.string().email().safeParse(i.trim()))
            ?.filter((i) => i.success)
            ?.map((i) => i.data) || [];

        await createPreviewsComment({
          issueId: item.issue.id,
          emails,
          previews: item.attachment.metadata.previewLinks,
          apiKey: this.config.linearApiKey,
          footer: this.config.previewsCommentFooter,
        });
        await vscode.window.showInformationMessage(
          `Send preview to ${emails.join(",")} success`,
        );
      },
    );

    vscode.commands.registerCommand(
      "lychee-quick.openPullRequest",
      async (item: LinearPullRequestTreeItem) => {
        vscode.env.openExternal(vscode.Uri.parse(item.attachment.metadata.url));
      },
    );
  }

  async getTreeItem(
    element: LinearTreeItem | LinearTreeGroup | LinearPullRequestTreeItem,
  ) {
    return element;
  }

  async getChildren(
    element?: LinearTreeItem | LinearTreeGroup,
  ): Promise<(LinearTreeItem | LinearTreeGroup | LinearPullRequestTreeItem)[]> {
    if (!this.config.linearApiKey || !this.config.linearTeam) {
      return [];
    }
    if (!element) {
      return Promise.all(groups.map((group) => this.createGroup(group)));
    }
    if (element instanceof LinearTreeGroup) {
      return Promise.all(
        element.data.issues.map(({ issue, state, attachments }) =>
          this.createTreeItem(issue, state, attachments),
        ),
      );
    }
    if (element instanceof LinearTreeItem) {
      return Promise.all(
        element.attachments.map((attachment) =>
          this.createPullRequest(element.issue, attachment),
        ),
      );
    }
    return [];
  }

  private async createGroup(group: (typeof groups)[number]) {
    const data = await this.cache.get(group);
    return new LinearTreeGroup(group, data);
  }

  private async createPullRequest(issue: Issue, attachment: Attachment) {
    const map: Record<string, string> = {
      draft: "✏️",
      open: "🌱",
      closed: "⛔",
      merged: "🎉",
    };
    const label = `${map[attachment.metadata.status]} ${attachment.metadata.title}`;
    return new LinearPullRequestTreeItem(issue, attachment, label);
  }
  private async createTreeItem(
    issue: Issue,
    state: WorkflowState,
    attachments: Attachment[],
  ) {
    const map: Record<string, string> = {
      unstarted: "🟡",
      started: "🟠",
      completed: "🟢",
    };
    const label = `${map[state?.type ?? "unstarted"]} [${issue.identifier}]${issue.title}`;
    return new LinearTreeItem(issue, label, attachments);
  }

  refresh(): void {
    this.cache.clearAll();
    this._onDidChangeTreeData.fire(undefined);
  }
}
