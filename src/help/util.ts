import * as vscode from "vscode";

export const openExternal = (url: string) =>
  vscode.env.openExternal(vscode.Uri.parse(url));
