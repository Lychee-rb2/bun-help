import { cli } from "@/help";
import * as vscode from "vscode";
import type { ProjectBrancheTreeItem } from "./deployment-tree-item";
import type { DeployHookTreeItem, ReleaseTreeItem } from "./release-tree-item";

export const releaseProjects = async ({
  label,
  deployHooks,
}: ReleaseTreeItem) => {
  const answer = await vscode.window.showInformationMessage(
    `Do you want to trigger ${label} branch of all projects?`,
    {
      modal: true,
      detail: deployHooks.map(({ projectName }) => projectName).join("\n"),
    },
    "Yes",
  );
  if (!answer) return;
  const res = await Promise.all(
    deployHooks.map(({ url, projectName }) =>
      fetch(url).then((res) => ({ res, projectName })),
    ),
  );
  if (res.every((i) => i.res.ok)) {
    await vscode.window.showInformationMessage(
      `Trigger ${label} branch of all projects success`,
    );
  } else {
    await vscode.window.showInformationMessage(
      `Some trigger ${label} branch of projects fail`,
      {
        modal: true,
        detail: res
          .map(
            ({ res, projectName }) =>
              `${projectName} ${res.ok ? "success" : "fail"}`,
          )
          .join("\n"),
      },
    );
  }
};
export const releaseProject = async ({
  deployHook: { ref, projectName, url },
}: DeployHookTreeItem) => {
  const answer = await vscode.window.showInformationMessage(
    `Do you want to trigger ${ref} of ${projectName}?`,
    "Yes",
  );
  if (!answer) return;
  const res = await fetch(url);
  if (res.ok) {
    await vscode.window.showInformationMessage(
      `Trigger ${ref} of ${projectName} success`,
    );
  } else {
    await vscode.window.showInformationMessage(
      `Trigger ${ref} of ${projectName} fail`,
    );
  }
};

export const checkoutBranch = async (item: ProjectBrancheTreeItem) => {
  await cli(["git", "checkout", item.branch]);
  await vscode.window.showInformationMessage(
    `Checkout branch ${item.branch} success`,
  );
};
