import * as vscode from "vscode";

export const openExternal = async (url?: string | null) => {
  if (url) {
    await vscode.env.openExternal(vscode.Uri.parse(url));
  }
};

export type FalseType = "" | 0 | false | null | undefined;

export const typedBoolean = <Value>(
  value: Value,
): value is Exclude<Value, FalseType> => Boolean(value);
