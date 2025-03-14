import type { Issue } from "@linear/sdk";
import * as vscode from "vscode";
import { findNextBranch } from "./help/git";
import { cli } from "./help/io";
import { LinearTreeDataProvider } from "./views/linear";

export function activate(context: vscode.ExtensionContext) {
  // Get configuration
  const config = vscode.workspace.getConfiguration("lychee-quick");

  const linearApiKey = config.get<string>("linearApiKey");
  const linearTeam = config.get<string>("linearTeam");
  const linearSpace = config.get<string>("linearSpace");
  const vercelToken = config.get<string>("vercelToken");
  const vercelProject = config.get<string>("vercelProject");
  const vercelTeam = config.get<string>("vercelTeam");
  const deepseekApi = config.get<string>("deepseekApi");
  const moonshotApi = config.get<string>("moonshotApi");

  console.log(
    linearApiKey,
    linearTeam,
    linearSpace,
    vercelToken,
    vercelProject,
    vercelTeam,
    deepseekApi,
    moonshotApi,
  );
  if (linearApiKey && linearTeam) {
    const linearTreeDataProvider = new LinearTreeDataProvider(
      linearApiKey,
      linearTeam,
      context.globalState,
    );
    const linearTreeView = vscode.window.registerTreeDataProvider(
      "lychee-quick.linearView",
      linearTreeDataProvider,
    );
    // Handle button clicks
    vscode.commands.registerCommand("lychee-quick.openIssue", (item) => {
      vscode.env.openExternal(vscode.Uri.parse(item));
    });

    vscode.commands.registerCommand(
      "lychee-quick.checkBranch",
      async (item) => {
        const branchName = await findNextBranch(
          (item.issue as Issue).branchName,
        );
        await cli(["git", "checkout", "main"]);
        await cli(["git", "pull"]);
        await cli(["git", "checkout", "-b", branchName]);
        await vscode.window.showInformationMessage(
          `Checkout branch ${branchName} success`,
        );
      },
    );
    vscode.commands.registerCommand("lychee-quick.refreshLinear", async () => {
      linearTreeDataProvider.refresh();
    });
    context.subscriptions.push(linearTreeView);
  }
}

export function deactivate() {}
