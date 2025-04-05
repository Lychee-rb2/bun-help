import { cli } from "@/help";
import * as vscode from "vscode";
import type { DeployHook } from "./type";

export const releaseProjects = async (
  branch: string,
  deployHooks: (DeployHook & { projectName: string })[],
) => {
  const answer = await vscode.window.showInformationMessage(
    `Do you want to trigger ${branch} branch of all projects?`,
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
      `Trigger ${branch} branch of all projects success`,
    );
  } else {
    await vscode.window.showInformationMessage(
      `Some trigger ${branch} branch of projects fail`,
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
export const releaseProject = async (
  { ref, url }: DeployHook,
  projectName: string,
) => {
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

export const checkoutBranch = async (branch: string) => {
  await cli(["git", "checkout", branch]);
  await vscode.window.showInformationMessage(
    `Checkout branch ${branch} success`,
  );
};
