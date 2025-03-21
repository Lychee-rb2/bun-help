import * as vscode from "vscode";
import { LinearTreeDataProvider } from "./views/linear";
import { VercelTreeDataProvider } from "./views/vercel";

export function activate(context: vscode.ExtensionContext) {
  // Get configuration
  const config = vscode.workspace.getConfiguration("lychee-quick");

  const linearApiKey = config.get<string>("linearApiKey");
  const linearTeam = config.get<string>("linearTeam");

  const vercelToken = config.get<string>("vercelToken");
  const vercelTeam = config.get<string>("vercelTeam");

  if (linearApiKey && linearTeam) {
    const linearTreeDataProvider = new LinearTreeDataProvider(context);
    context.subscriptions.push(linearTreeDataProvider.dispose);
  }

  if (vercelToken && vercelTeam) {
    const vercelTreeDataProvider = new VercelTreeDataProvider(
      vercelToken,
      vercelTeam,
      context.globalState,
    );
    context.subscriptions.push(vercelTreeDataProvider.dispose);
  }
}

export function deactivate() {}
