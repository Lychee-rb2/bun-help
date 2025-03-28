import * as vscode from "vscode";

export const openExternal = (url?: string) => {
  if (url) {
    vscode.env.openExternal(vscode.Uri.parse(url));
  }
};
