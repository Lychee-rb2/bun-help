import * as vscode from "vscode";
import { EXTENSION } from "./help";
import { linearView } from "./views/linear/view";
import { vercelView } from "./views/vercel/view";

export function activate(context: vscode.ExtensionContext) {
  // Get configuration
  const config = vscode.workspace.getConfiguration(EXTENSION);

  const linearApiKey = config.get<string>("linearApiKey");
  const linearTeam = config.get<string>("linearTeam");

  const vercelToken = config.get<string>("vercelToken");
  const vercelTeam = config.get<string>("vercelTeam");

  if (linearApiKey && linearTeam) {
    linearView();
    // context.subscriptions.push(linearTreeDataProvider.dispose);
  }

  if (vercelToken && vercelTeam) {
    vercelView();
    // context.subscriptions.push(vercelTreeDataProvider.dispose);
  }
}

export function deactivate() {}
