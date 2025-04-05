import * as vscode from "vscode";

export interface TreeItemProvider {
  treeItem: vscode.TreeItem;
  getChildren: () => TreeItemProvider[];
}
