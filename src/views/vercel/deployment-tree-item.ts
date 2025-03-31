import { iconMap, treeId, typedBoolean, VERCEL_VIEW } from "@/help";
import { formatDistanceStrict, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import * as vscode from "vscode";
import { VercelDeploymentsCache } from "./cache";
import type { Deployment, Project } from "./type";
import type { VercelTreeDataProvider } from "./view";
const deploymentsStateMap = {
  BUILDING: "vercel_building",
  ERROR: "vercel_error",
  READY: "vercel_ready",
  INITIALIZING: "vercel_queued",
  QUEUED: "vercel_queued",
  CANCELED: "vercel_error",
  DELETED: "vercel_error",
} as const;

const buildCost = (deployment: Deployment) => {
  if (!deployment.buildingAt) return "Not build";
  if (!deployment.ready) return "Building";
  const buildingAt = formatDistanceToNow(deployment.buildingAt, {
    addSuffix: true,
    locale: zhCN,
  });
  if (deployment.state === "BUILDING") {
    return `${buildingAt}`;
  }
  return `${buildingAt} (${formatDistanceStrict(
    deployment.ready,
    deployment.buildingAt,
    { unit: "second", locale: zhCN },
  )})`;
};

export class DeploymentsTreeItem extends vscode.TreeItem {
  contextValue = treeId(VERCEL_VIEW, "deployments");
  constructor(public projects: Project[]) {
    super("deployments", vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = iconMap("deployments");
  }

  getChildren(context: VercelTreeDataProvider) {
    return ProjectDeploymentsTreeItem.from(this.projects, context);
  }
}

export class ProjectDeploymentsTreeItem extends vscode.TreeItem {
  contextValue = treeId(VERCEL_VIEW, "deployments.project");
  constructor(
    public project: Project,
    public cache: VercelDeploymentsCache,
  ) {
    super(project.name, vscode.TreeItemCollapsibleState.Collapsed);
  }

  static from(projects: Project[], context: VercelTreeDataProvider) {
    return Promise.all(
      projects.map(
        (project) =>
          new ProjectDeploymentsTreeItem(
            project,
            new VercelDeploymentsCache(context, project),
          ),
      ),
    );
  }
  getChildren(_: VercelTreeDataProvider) {
    return ProjectBrancheTreeItem.from(this);
  }
}
export class ProjectBrancheTreeItem extends vscode.TreeItem {
  contextValue = treeId(VERCEL_VIEW, "deployments.project.branch");
  constructor(
    public branch: string,
    public project: Project,
    public deployments: Deployment[],
  ) {
    super(branch, vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = iconMap("branch");
  }

  static async from({ project, cache }: ProjectDeploymentsTreeItem) {
    const groupByBranch = await cache.getDeployments();
    return Object.entries(groupByBranch).map(
      ([branch, deployments]) =>
        new ProjectBrancheTreeItem(branch, project, deployments),
    );
  }
  getChildren(_: VercelTreeDataProvider) {
    return ProjectDeploymentTreeItem.from(this);
  }
}

export class ProjectDeploymentTreeItem extends vscode.TreeItem {
  contextValue = treeId(VERCEL_VIEW, "deployments.project.deployment");

  constructor(
    public project: Project,
    public deployment: Deployment,
  ) {
    super(buildCost(deployment), vscode.TreeItemCollapsibleState.None);
    if (project.targets?.production?.id === deployment.uid) {
      this.iconPath = iconMap("production");
    }
    this.iconPath = iconMap(
      deploymentsStateMap[deployment.state || "INITIALIZING"],
    );
    this.tooltip = [deployment.meta?.githubCommitMessage]
      .filter(typedBoolean)
      .join("\n");
  }

  static from({ deployments, project }: ProjectBrancheTreeItem) {
    return deployments.map(
      (deployment) => new ProjectDeploymentTreeItem(project, deployment),
    );
  }

  getChildren(_: VercelTreeDataProvider) {
    return [];
  }
}
