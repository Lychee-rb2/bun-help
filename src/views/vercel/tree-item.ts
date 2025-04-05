import {
  iconMap,
  openExternal,
  treeId,
  typedBoolean,
  VERCEL_VIEW,
} from "@/help";
import type { Cache } from "@/help/cache";
import { formatDistanceStrict, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import * as vscode from "vscode";
import { checkoutBranch, releaseProject, releaseProjects } from "./action";
import { vercelDeploymentsCache } from "./cache";
import type { DeployHook as _DeployHook, Deployment, Project } from "./type";

type DeployHook = _DeployHook & {
  projectName: Project["name"];
};
export const releaseTreeItemFrom = (projects: Project[]) => {
  const map = projects.reduce<Record<string, DeployHook[]>>(
    (acc, { link, name }) => {
      link?.deployHooks.forEach((deployHook) => {
        const branch = deployHook.ref;
        acc[branch] = acc[branch] || [];
        acc[branch].push({ ...deployHook, projectName: name });
      });
      return acc;
    },
    {},
  );
  return Object.entries(map).map(([branch, deployHooks]) =>
    releaseTreeItem(branch, deployHooks),
  );
};

export const releaseTreeItem = (branch: string, deployHooks: DeployHook[]) => {
  const treeItem = new vscode.TreeItem(
    branch,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  treeItem.contextValue = treeId(VERCEL_VIEW, "releases.branch");
  treeItem.iconPath = iconMap("branch");

  return {
    treeItem,
    getChildren: () =>
      deployHooks.map((deployHook) => deployHookTreeItem(deployHook)),
    releaseProjects: () => releaseProjects(branch, deployHooks),
  };
};

export const deployHookTreeItem = (deployHook: DeployHook) => {
  const treeItem = new vscode.TreeItem(
    deployHook.projectName,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  treeItem.contextValue = treeId(VERCEL_VIEW, "releases.branch.project");
  return {
    treeItem,
    getChildren: () => [],
    releaseProject: () => releaseProject(deployHook, deployHook.projectName),
  };
};

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

export const deploymentsTreeItem = (projects: Project[]) => {
  const treeItem = new vscode.TreeItem(
    "deployments",
    vscode.TreeItemCollapsibleState.Expanded,
  );
  treeItem.contextValue = treeId(VERCEL_VIEW, "deployments");
  return {
    treeItem,
    getChildren: () =>
      projects.map((project) =>
        projectDeploymentsTreeItem(project, vercelDeploymentsCache(project)),
      ),
  };
};

export const projectDeploymentsTreeItem = (
  project: Project,
  cache: Cache<Record<string, Deployment[]>>,
) => {
  const treeItem = new vscode.TreeItem(
    project.name,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  treeItem.contextValue = treeId(VERCEL_VIEW, "deployments.project");
  return {
    treeItem,
    getChildren: async () => {
      const groupByBranch = await cache.get();
      return Object.entries(groupByBranch).map(([branch, deployments]) =>
        projectBranchTreeItem(branch, project, deployments),
      );
    },
    refreshProject: () => cache.remove(),
  };
};

export const projectBranchTreeItem = (
  branch: string,
  project: Project,
  deployments: Deployment[],
) => {
  const treeItem = new vscode.TreeItem(
    branch,
    vscode.TreeItemCollapsibleState.Collapsed,
  );
  treeItem.contextValue = treeId(VERCEL_VIEW, "deployments.project.branch");
  treeItem.iconPath = iconMap("branch");

  return {
    treeItem,
    getChildren: () =>
      deployments.map((deployment) =>
        projectDeploymentTreeItem(project, deployment),
      ),
    openPreview: () => {
      const url = deployments.at(0)?.meta?.branchAlias;
      if (url) {
        await openExternal("https://" + url);
      }
    },
    checkoutBranch: () => checkoutBranch(branch),
  };
};

export const projectDeploymentTreeItem = (
  project: Project,
  deployment: Deployment,
) => {
  const treeItem = new vscode.TreeItem(buildCost(deployment));
  treeItem.contextValue = treeId(VERCEL_VIEW, "deployments.project.deployment");
  if (project.targets?.production?.id === deployment.uid) {
    treeItem.iconPath = iconMap("production");
  } else {
    treeItem.iconPath = iconMap(
      deploymentsStateMap[deployment.state || "INITIALIZING"],
    );
  }
  treeItem.tooltip = [deployment.meta?.githubCommitMessage]
    .filter(typedBoolean)
    .join("\n");
  return {
    treeItem,
    getChildren: () => [],
    openInspector: () => openExternal(deployment.inspectorUrl),
  };
};
