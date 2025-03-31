import * as vscode from "vscode";
import { EXTENSION } from "./help";
import { LinearTreeDataProvider } from "./views/linear/view";
import { VercelTreeDataProvider } from "./views/vercel/view";

export function activate(context: vscode.ExtensionContext) {
  // Get configuration
  const config = vscode.workspace.getConfiguration(EXTENSION);

  const linearApiKey = config.get<string>("linearApiKey");
  const linearTeam = config.get<string>("linearTeam");

  const vercelToken = config.get<string>("vercelToken");
  const vercelTeam = config.get<string>("vercelTeam");

  if (linearApiKey && linearTeam) {
    new LinearTreeDataProvider(context);
    // context.subscriptions.push(linearTreeDataProvider.dispose);
  }

  if (vercelToken && vercelTeam) {
    new VercelTreeDataProvider(context);
    // context.subscriptions.push(vercelTreeDataProvider.dispose);
  }
}

export function deactivate() {}
