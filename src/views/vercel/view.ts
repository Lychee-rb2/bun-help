import { openExternal, register, VERCEL_VIEW } from "@/help";
import { Vercel } from "@vercel/sdk";
import * as vscode from "vscode";
import { checkoutBranch, releaseProject, releaseProjects } from "./action";
import { VercelProjectsCache } from "./cache";
import {
  DeploymentsTreeItem,
  ProjectBrancheTreeItem,
  ProjectDeploymentsTreeItem,
  ProjectDeploymentTreeItem,
} from "./deployment-tree-item";
import { DeployHookTreeItem, ReleaseTreeItem } from "./release-tree-item";

type DeploymentTreeItem =
  | DeploymentsTreeItem
  | ProjectDeploymentsTreeItem
  | ProjectDeploymentTreeItem
  | ProjectBrancheTreeItem;

type TreeItem = ReleaseTreeItem | DeployHookTreeItem | DeploymentTreeItem;

export class VercelTreeDataProvider
  implements vscode.TreeDataProvider<TreeItem>
{
  readonly id = VERCEL_VIEW;
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> =
    new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event;
  private projectsCache: VercelProjectsCache;
  private client: Vercel;
  private register = (
    command: string,
    callback: Parameters<typeof register>[1],
  ) => {
    register(`${this.id}.${command}`, callback);
  };

  constructor(public context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration("lychee-quick");
    this.client = new Vercel({ bearerToken: config.get("vercelToken") });
    this.projectsCache = new VercelProjectsCache(context, this.client);
    vscode.window.createTreeView(`lychee-quick.${this.id}`, {
      treeDataProvider: this,
      manageCheckboxStateManually: true,
    });
    this.initCommands();
  }

  private initCommands() {
    this.register("refresh", () => this.refresh());
    this.register("release-projects", (item: ReleaseTreeItem) =>
      releaseProjects(item),
    );
    this.register("release-project", (item: DeployHookTreeItem) =>
      releaseProject(item),
    );
    this.register("open-preview", (item: ProjectBrancheTreeItem) => {
      const url = item.deployments.at(0)?.meta?.branchAlias;
      if (url) {
        openExternal("https://" + url);
      }
    });
    this.register("open-inspector", (item: ProjectDeploymentTreeItem) =>
      openExternal(item.deployment.inspectorUrl),
    );
    this.register(
      "refresh-project",
      async (item: ProjectDeploymentsTreeItem) => {
        await item.cache.clear();
        this._onDidChangeTreeData.fire(undefined);
      },
    );
    this.register("check-branch", (item: ProjectBrancheTreeItem) =>
      checkoutBranch(item),
    );
  }

  async getTreeItem(element: TreeItem) {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    const projects = await this.projectsCache.getProjects();
    if (!element) {
      return [...ReleaseTreeItem.from(projects), new DeploymentsTreeItem()];
    }
    if (element instanceof ReleaseTreeItem) {
      return DeployHookTreeItem.from(element);
    }
    if (!projects) return [];
    if (element instanceof DeploymentsTreeItem) {
      return ProjectDeploymentsTreeItem.from(
        projects,
        this.context,
        this.client,
      );
    }
    if (element instanceof ProjectDeploymentsTreeItem) {
      return ProjectBrancheTreeItem.from(element);
    }
    if (element instanceof ProjectBrancheTreeItem) {
      return ProjectDeploymentTreeItem.from(element);
    }
    return [];
  }

  async refresh() {
    await this.projectsCache.clear();
    this._onDidChangeTreeData.fire(undefined);
  }
}
