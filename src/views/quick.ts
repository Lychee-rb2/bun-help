import * as vscode from "vscode";

interface TreeItem {
  id: string;
  label: string;
  parent: string | "root";
}

export class LycheeQuickTreeDataProvider
  implements vscode.TreeDataProvider<TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> =
    new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event;

  private groups: TreeItem[] = [
    {
      id: "vercel",
      label: "Vercel",
      parent: "root",
    },
    {
      id: "linear",
      label: "Linear",
      parent: "root",
    },
    {
      id: "git",
      label: "Git",
      parent: "root",
    },
    {
      id: "vercel-release",
      label: "Release",
      parent: "vercel",
    },
    {
      id: "vercel-check",
      label: "Check",
      parent: "vercel",
    },
    {
      id: "vercel-preview",
      label: "Preview",
      parent: "vercel",
    },
    {
      id: "git-ai-commit",
      label: "AI-commit",
      parent: "git",
    },
    {
      id: "linear-ticket-123",
      label: "Ticket-123",
      parent: "linear",
    },
    {
      id: "linear-ticket-456",
      label: "Ticket-456",
      parent: "linear",
    },
    {
      id: "linear-ticket-789",
      label: "Ticket-789",
      parent: "linear",
    },
  ];

  constructor() {}

  refresh(): void {
    console.log("refresh");
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label);

    // Check if this element is a group (has children)
    const isGroup = element.parent === "root";

    // Set collapsible state based on whether it's a group
    item.collapsibleState = isGroup
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;

    item.command = {
      command: "lychee-quick.buttonClick",
      title: "Click Button",
      arguments: [element.id],
    };
    return item;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    if (!element) {
      // Root level - return group names
      return Promise.resolve(this.groups.filter((g) => g.parent === "root"));
    }
    return Promise.resolve(
      this.groups.filter((g) => g.parent === element.id) || [],
    );
  }
}
