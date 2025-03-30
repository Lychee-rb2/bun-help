import * as vscode from "vscode";

export const openExternal = (url?: string | null) => {
  if (url) {
    vscode.env.openExternal(vscode.Uri.parse(url));
  }
};

export type FalseType = "" | 0 | false | null | undefined;

export const typedBoolean = <Value>(
  value: Value,
): value is Exclude<Value, FalseType> => Boolean(value);
