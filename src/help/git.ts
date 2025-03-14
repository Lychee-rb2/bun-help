import { cli } from "./io";

export const findNextBranch = async (
  branch: string,
  version = 1,
): Promise<string> => {
  const cur = version > 1 ? `${branch}-${version}` : branch;
  const output = await cli(["git", "branch", "--list", cur]);
  return output.trim() ? findNextBranch(branch, version + 1) : cur;
};
