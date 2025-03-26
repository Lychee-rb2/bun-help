import * as vscode from "vscode";
import { extension } from "./const";

export const register = <
  T extends Parameters<typeof vscode.commands.registerCommand>[1],
>(
  cmd: string,
  fn: T,
) => vscode.commands.registerCommand(`${extension}.${cmd}`, fn);

export const getConfig = () => vscode.workspace.getConfiguration(extension);

export const iconMap = (key: string) => {
  const map: Record<string, [string, string]> = {
    draft: ["git-pull-request-draft", "pullRequests.draft"],
    open: ["git-pull-request", "pullRequests.open"],
    closed: ["git-pull-request-closed", "pullRequests.closed"],
    merged: ["git-merge", "pullRequests.merged"],
    unstarted: ["star-empty", "terminal.foreground"],
    started: ["star-full", "terminal.ansiBlue"],
    completed: ["star-full", "terminal.ansiGreen"],
    canceled: ["close", "terminal.ansiRed"],
    backlog: ["info", "terminal.foreground"],
    triage: ["info", "terminal.foreground"],
  };
  const icon = map[key];
  if (icon) {
    return new vscode.ThemeIcon(icon[0], new vscode.ThemeColor(icon[1]));
  }
  return undefined;
};
