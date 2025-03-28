import { treeId, VERCEL_VIEW } from "@/src/help";
import type { GetProjectsLinkDeployHooks } from "@vercel/sdk/models/getprojectsop.js";
import * as vscode from "vscode";
import { Project, type DeployHook } from "./type";

export class ReleaseTreeItem extends vscode.TreeItem {
  contextValue = treeId(VERCEL_VIEW, "releases.branch");
  constructor(
    public label: string,
    public deployHooks: (GetProjectsLinkDeployHooks & { project: string })[],
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
  }

  static from(projects: Project[]) {
    const map = projects.reduce<
      Record<string, (DeployHook & { project: string })[]>
    >((acc, project) => {
      project.link?.deployHooks.forEach((deployHook) => {
        const branch = deployHook.ref;
        acc[branch] = acc[branch] || [];
        acc[branch].push({ ...deployHook, project: project.name });
      });
      return acc;
    }, {});
    return Object.entries(map).map(([branch, deployHooks]) => {
      return new ReleaseTreeItem(branch, deployHooks);
    });
  }
}
export class DeployHookTreeItem extends vscode.TreeItem {
  contextValue = treeId(VERCEL_VIEW, "releases.branch.hook");
  constructor(
    public deployHook: GetProjectsLinkDeployHooks & { project: string },
  ) {
    super(deployHook.project, vscode.TreeItemCollapsibleState.None);
    this.tooltip = deployHook.url;
  }

  static from(releaseTreeItem: ReleaseTreeItem) {
    return releaseTreeItem.deployHooks.map(
      (deployHook) => new DeployHookTreeItem(deployHook),
    );
  }
}
