import { AI } from "@/fetch/deepseek";
import { KimiModel } from "@/types/ai";
import { cli, logger, parseArgv } from "help";
import { gitCommitPrompt } from "./ai";

export const findNextBranch = async (
  branch: string,
  version = 1,
): Promise<string> => {
  const cur = version > 1 ? `${branch}-${version}` : branch;
  const proc = cli(["git", "branch", "--list", cur]);
  const output = await new Response(proc.stdout).text();
  return output.trim() ? findNextBranch(branch, version + 1) : cur;
};

export const gitCommit = async (message: string) => {
  const proc = cli(["git", "commit", "--message", message]);
  return new Response(proc.stdout).text().then((t) => t.trim());
};

export const getBranch = async () => {
  const argv = parseArgv();
  if (argv.b) return Promise.resolve(argv.b);
  const proc = cli(["git", "branch", "--show-current"]);
  return new Response(proc.stdout).text().then((t) => t.trim());
};
export const getDiff = async () => {
  const proc = cli([
    "git",
    "diff",
    "--cached",
    "--patch",
    "--exclude=**/bun.lockb",
    "--exclude=**/package-lock.json",
    "--exclude=**/pnpm-lock.yaml",
  ]);
  return new Response(proc.stdout).text().then((t) => t.trim());
};
export const gitAdd = async (files: string[]) => {
  const proc = cli(["git", "add", ...files]);
  return new Response(proc.stdout).text().then((t) => t.trim());
};
export const gitUntracked = async () => {
  const proc = cli(["git", "ls-files", "--others", "--exclude-standard"]);
  return new Response(proc.stdout)
    .text()
    .then((t) => t.trim().split("\n").filter(Boolean));
};
export const getDiffStat = async () => {
  const proc = cli(["git", "diff", "--name-only"]);
  return new Response(proc.stdout)
    .text()
    .then((t) => t.trim().split("\n").filter(Boolean));
};
export const getCommitMessage = async () => {
  const files = await getDiffStat();
  if (files.length === 0) return "No diff";
  logger.debug("Files:");
  files.forEach((file) => {
    logger.debug(`${file}`);
  });
  logger.debug("  ");
  await gitAdd(files);
  const diff = await getDiff();
  const branch = await getBranch();
  if (!diff) return "No diff";
  const ai = new AI(KimiModel["moonshot-v1-8k"]);
  const res = await ai.fetch<{ message: string }>(
    gitCommitPrompt,
    JSON.stringify({
      VCS_BRANCH: branch,
      VCS_DIFF: diff,
    }),
  );
  return res.data.message;
};
