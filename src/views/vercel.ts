import { getDomains, getProjects } from "@/fetch/vercel";
import type { GetDeploymentsState } from "@vercel/sdk/models/getdeploymentsop.js";
import * as vscode from "vscode";

const groups = ["Production"] as const;
type Project = Awaited<ReturnType<typeof getProjects>>["projects"][number];

interface Cache<T> {
  d: T;
  t: number;
}
const emojiMap: Record<GetDeploymentsState, string> = {
  BUILDING: "🔨",
  INITIALIZING: "⌛️",
  QUEUED: "🕔",
  CANCELED: "⛔️",
  ERROR: "❌",
  READY: "🚀",
  DELETED: "🗑️",
};

export class VercelProjectsCache {
  constructor(
    public vercelAuth: string,
    public vercelTeam: string,
    public globalState: vscode.Memento,
  ) {}

  private cacheKey(key: string | string[]) {
    return `vercelCache-${this.vercelTeam}-${typeof key === "string" ? key : key.join("-")}`;
  }

  async get<T>(key: string | string[], fetch: () => Promise<T>) {
    const cacheKey = this.cacheKey(key);
    const cachedData = this.globalState.get<Cache<T>>(cacheKey);
    if (cachedData && Date.now() - cachedData.t < 1000 * 60 * 60 * 24) {
      return cachedData.d;
    }
    const data = { d: await fetch(), t: Date.now() } satisfies Cache<T>;
    await this.globalState.update(cacheKey, data);
    return data.d;
  }

  async clear(key: string) {
    const cacheKey = this.cacheKey(key);
    await this.globalState.update(cacheKey, undefined);
  }
}

export class VercelTreeGroup extends vscode.TreeItem {
  constructor(
    public group: (typeof groups)[number] | string,
    public projects: Project[],
  ) {
    super(group, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "lychee-quick.vercelViewGroup";
  }
}

export class VercelProjectTreeItem extends vscode.TreeItem {
  constructor(
    public project: Project,
    public label: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "lychee-quick.vercelProject";
  }
}

export class VercelTreeDataProvider
  implements vscode.TreeDataProvider<VercelTreeGroup | VercelProjectTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    VercelTreeGroup | VercelProjectTreeItem | undefined
  > = new vscode.EventEmitter<
    VercelTreeGroup | VercelProjectTreeItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<
    VercelTreeGroup | VercelProjectTreeItem | undefined
  > = this._onDidChangeTreeData.event;

  dispose: vscode.Disposable;
  private cache: VercelProjectsCache;

  constructor(
    public vercelAuth: string,
    public vercelTeam: string,
    public globalState: vscode.Memento,
  ) {
    this.cache = new VercelProjectsCache(
      this.vercelAuth,
      this.vercelTeam,
      this.globalState,
    );
    this.dispose = vscode.window.registerTreeDataProvider(
      "lychee-quick.vercelView",
      this,
    );
  }

  async getTreeItem(element: VercelTreeGroup) {
    return element;
  }

  async getChildren(
    element?: VercelTreeGroup,
  ): Promise<(VercelTreeGroup | VercelProjectTreeItem)[]> {
    if (!this.vercelAuth || !this.vercelTeam) {
      return [];
    }
    if (!element) {
      const projects = await this.cache.get("project", () =>
        getProjects(this.vercelAuth, this.vercelTeam).then(
          (res) => res.projects,
        ),
      );
      const domains = await Promise.all(
        projects.map((project) =>
          this.cache.get(["project", project.name], () =>
            getDomains(this.vercelAuth, this.vercelTeam, project.name).then(
              (res) => {
                const production = res.domains.find(
                  (domain) => !domain.gitBranch && !domain.redirect,
                );
                const acceptance = res.domains.filter(
                  (domain) => domain.gitBranch,
                );
                return { project, production, acceptance };
              },
            ),
          ),
        ),
      );

      return groups.map((group) => new VercelTreeGroup(group, projects));
    }
    if (element instanceof VercelTreeGroup) {
      return Promise.all(
        element.projects.map((project) =>
          this.createTreeItem(project, element),
        ),
      );
    }
    return [];
  }

  private async createTreeItem(project: Project, group: VercelTreeGroup) {
    switch (group.group) {
      case "Release": {
        const target = project.targets?.["production"];
        const branch = target?.meta?.githubCommitRef;
        const emoji = emojiMap[target?.readyState || "INITIALIZING"];
        return new VercelProjectTreeItem(project, `${emoji}[${branch}] `);
      }

      case "Preview":
        return new VercelProjectTreeItem(project);
    }
  }
}
