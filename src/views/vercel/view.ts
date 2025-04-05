import { EXTENSION, register, VERCEL_VIEW } from "@/help";
import type { Cache } from "@/help/cache";
import * as vscode from "vscode";
import { vercelProjectCache } from "./cache";

import {
  deployHookTreeItem,
  deploymentsTreeItem,
  projectBranchTreeItem,
  projectDeploymentsTreeItem,
  projectDeploymentTreeItem,
  releaseTreeItem,
  releaseTreeItemFrom,
} from "./tree-item";
import type { Project } from "./type";

type DeploymentsTreeItem = ReturnType<typeof deploymentsTreeItem>;
type ProjectDeploymentsTreeItem = ReturnType<typeof projectDeploymentsTreeItem>;
type ProjectBranchTreeItem = ReturnType<typeof projectBranchTreeItem>;
type ProjectDeploymentTreeItem = ReturnType<typeof projectDeploymentTreeItem>;
type ReleaseTreeItem = ReturnType<typeof releaseTreeItem>;
type DeployHookTreeItem = ReturnType<typeof deployHookTreeItem>;

type TreeItem =
  | DeploymentsTreeItem
  | ProjectDeploymentsTreeItem
  | ProjectBranchTreeItem
  | ProjectDeploymentTreeItem
  | ReleaseTreeItem
  | DeployHookTreeItem;

export class VercelTreeDataProvider
  implements vscode.TreeDataProvider<TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> =
    new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(public cache: Cache<Project[]>) {}

  async getTreeItem(item: TreeItem) {
    return item.treeItem;
  }

  async getChildren(item?: TreeItem): Promise<TreeItem[]> {
    const projects = await this.cache.get();
    if (!item) {
      return [...releaseTreeItemFrom(projects), deploymentsTreeItem(projects)];
    }
    return item.getChildren();
  }

  async refresh() {
    await this.cache.remove();
    this._onDidChangeTreeData.fire(undefined);
  }
}

export const vercelView = () => {
  const cmd = (cmd: string) => `${VERCEL_VIEW}.${cmd}`;
  const projectsCache = vercelProjectCache();
  const treeDataProvider = new VercelTreeDataProvider(projectsCache);
  vscode.window.createTreeView(`${EXTENSION}.${VERCEL_VIEW}`, {
    treeDataProvider,
  });
  register(cmd("refresh"), () => treeDataProvider.refresh());
  register<ReleaseTreeItem>(cmd("release-projects"), (item) =>
    item.releaseProjects(),
  );
  register<DeployHookTreeItem>(cmd("release-project"), (item) =>
    item.releaseProject(),
  );
  register<ProjectBranchTreeItem>(cmd("open-preview"), (item) =>
    item.openPreview(),
  );
  register<ProjectDeploymentTreeItem>(cmd("open-inspector"), (item) =>
    item.openInspector(),
  );
  register<ProjectDeploymentsTreeItem>(cmd("refresh-project"), (item) =>
    item.refreshProject(),
  );
  register<ProjectBranchTreeItem>(cmd("check-branch"), (item) =>
    item.checkoutBranch(),
  );
};
