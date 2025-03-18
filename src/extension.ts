import * as vscode from "vscode";
import { LinearTreeDataProvider } from "./views/linear";

export function activate(context: vscode.ExtensionContext) {
  // Get configuration
  const config = vscode.workspace.getConfiguration("lychee-quick");

  const linearApiKey = config.get<string>("linearApiKey");
  const linearTeam = config.get<string>("linearTeam");
  // const linearSpace = config.get<string>("linearSpace");
  // const vercelToken = config.get<string>("vercelToken");
  // const vercelProject = config.get<string>("vercelProject");
  // const vercelTeam = config.get<string>("vercelTeam");
  // const deepseekApi = config.get<string>("deepseekApi");
  // const moonshotApi = config.get<string>("moonshotApi");

  if (linearApiKey && linearTeam) {
    const linearTreeDataProvider = new LinearTreeDataProvider(
      linearApiKey,
      linearTeam,
      context.globalState,
    );

    context.subscriptions.push(linearTreeDataProvider.dispose);
  }
}

export function deactivate() {}
