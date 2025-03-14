import { exec } from "child_process";
import * as vscode from "vscode";

export const cli = (cmd: string[]) => {
  return new Promise<string>((resolve, reject) => {
    exec(
      cmd.join(" "),
      { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      },
    );
  });
};
