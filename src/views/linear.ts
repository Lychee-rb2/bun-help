import { createPreviewsComment, getCycleIssues } from "@/fetch/linear";
import { type Attachment, type Issue, type WorkflowState } from "@linear/sdk";
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
    group: (typeof groups)[number];
  }[];
  t: number;
}

export class LinearIssuesCache {
  private config = vscode.workspace.getConfiguration("lychee-quick");
  private cacheKey: string;
  constructor(public context: vscode.ExtensionContext) {
    this.cacheKey = `linearIssuesCache-${this.config.linearTeam}`;
  }

  private async fetchLinearIssues(): Promise<IssuesCache["issues"]> {
    return (
      await Promise.all(
        groups.map(async (group) => {
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
                return { issue, state, attachments, group };
              }),
          );
        }),
      )
    ).flat();
  }
  async getIssue() {
    const cachedData = this.context.globalState.get<IssuesCache>(this.cacheKey);
    if (cachedData && Date.now() - cachedData.t < 1000 * 60 * 60 * 24) {
      return cachedData;
    }
    const data = {
      issues: await this.fetchLinearIssues(),
      t: Date.now(),
    } satisfies IssuesCache;
    await this.context.globalState.update(this.cacheKey, data);
    return data;
  }

  async clear() {
    await this.context.globalState.update(this.cacheKey, undefined);
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
    public data: IssuesCache["issues"],
  ) {
    super(group, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "lychee-quick.linearViewGroup";
  }
}

export class LinearTreeItem extends vscode.TreeItem {
  constructor(
    public issue: Issue,
    public label: string,
    public attachments: Attachment[],
    public isReleaseCheckboxEnabled: boolean,
  ) {
    super(
      label,
      attachments.length
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );
    this.contextValue = "lychee-quick.linearViewItem";
    if (isReleaseCheckboxEnabled) {
      this.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
    }
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
  // public dispose: vscode.Disposable;
  private config = vscode.workspace.getConfiguration("lychee-quick");
  private isReleaseCheckboxEnabled = false;
  private selectedItems: Set<LinearTreeItem> = new Set();
  private _onDidChangeCheckboxState = new vscode.EventEmitter<
    vscode.TreeCheckboxChangeEvent<LinearTreeItem>
  >();
  readonly onDidChangeCheckboxState = this._onDidChangeCheckboxState.event;
  constructor(context: vscode.ExtensionContext) {
    this.isReleaseCheckboxEnabled = false;
    this.cache = new LinearIssuesCache(context);

    const view = vscode.window.createTreeView("lychee-quick.linearView", {
      treeDataProvider: this,
      manageCheckboxStateManually: true,
    });

    view.onDidChangeCheckboxState((event) => {
      event.items.forEach(([item, state]) => {
        if (item instanceof LinearTreeItem) {
          if (state === vscode.TreeItemCheckboxState.Checked) {
            this.selectedItems.add(item);
          } else {
            this.selectedItems.delete(item);
          }
        }
      });
    });

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

    vscode.commands.registerCommand("lychee-quick.releaseIssues", async () => {
      switch (this.isReleaseCheckboxEnabled) {
        case true: {
          this.isReleaseCheckboxEnabled = false;
          this._onDidChangeTreeData.fire(undefined);
          const content = [...this.selectedItems]
            .map((i) => {
              return {
                title: i.issue.identifier + " " + i.issue.title,
                url: i.issue.url,
                prs: i.attachments.map((a) => ({
                  title: a.metadata.title,
                  url: a.metadata.url,
                })),
              };
            })
            .map((i) => {
              return [
                `## [${i.title}](${i.url})`,
                ...i.prs.map((pr) => `- [${pr.title}](${pr.url})`),
              ].join("\n");
            })
            .join("\n");
          await vscode.env.clipboard.writeText(content);
          await vscode.window.showInformationMessage("已复制到剪贴板");
          this.selectedItems.clear();
          break;
        }
        case false:
          this.isReleaseCheckboxEnabled = true;
          this._onDidChangeTreeData.fire(undefined);
          break;
      }
    });
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
      await this.cache.getIssue();
      return Promise.all(groups.map((group) => this.createGroup(group)));
    }
    if (element instanceof LinearTreeGroup) {
      return Promise.all(
        element.data.map(({ issue, state, attachments }) =>
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
    const data = await this.cache.getIssue();
    return new LinearTreeGroup(
      group,
      data.issues.filter((i) => i.group === group),
    );
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
    return new LinearTreeItem(
      issue,
      label,
      attachments,
      this.isReleaseCheckboxEnabled,
    );
  }

  refresh(): void {
    this.cache.clear();
    this._onDidChangeTreeData.fire(undefined);
  }
}
