import { register, VERCEL_VIEW } from "@/src/help";
import { Vercel } from "@vercel/sdk";
import type { TreeItem } from "vscode";
import * as vscode from "vscode";
import { VercelProjectsCache } from "./cache";

export class VercelTreeDataProvider
  implements vscode.TreeDataProvider<TreeItem>
{
  readonly id = VERCEL_VIEW;
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> =
    new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event;
  private cache: VercelProjectsCache;
  private client: Vercel;
  private register = (
    command: string,
    callback: Parameters<typeof register>[1],
  ) => {
    register(`${this.id}.${command}`, callback);
  };

  constructor(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration("lychee-quick");
    this.client = new Vercel({ bearerToken: config.get("vercelToken") });
    this.cache = new VercelProjectsCache(context, this.client);
    vscode.window.createTreeView(`lychee-quick.${this.id}`, {
      treeDataProvider: this,
      manageCheckboxStateManually: true,
    });
    this.initCommands();
  }

  private initCommands() {
    this.register("refresh", () => this.refresh());
  }

  getTreeItem(element: TreeItem) {
    return element;
  }
  getChildren(): vscode.ProviderResult<TreeItem[]> {
    return [];
  }

  refresh(): void {
    this.cache.clear();
    this._onDidChangeTreeData.fire(undefined);
  }
}
