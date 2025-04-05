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
  }

  if (vercelToken && vercelTeam) {
    vercelView();
  }
}

export function deactivate() {}
