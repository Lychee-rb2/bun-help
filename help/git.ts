import { cli, parseArgv } from 'help'

export const findNextBranch = async (branch: string, version = 1): Promise<string> => {
  const cur = version > 1 ? `${branch}-${version}`: branch;
  const proc = cli(`git branch --list ${cur}`);
  const output = await new Response(proc.stdout).text();
  return output.trim() ? findNextBranch(branch, version + 1) : cur
};

export const getBranch = () => {
  const argv = parseArgv()
  if (argv.b) return Promise.resolve(argv.b)
  const proc = cli(`git branch --show-current`);
  return new Response(proc.stdout).text().then(t => t.trim());
}
