import { LinearClient } from '@linear/sdk'
import { cli, parseArgv } from 'help/io.ts'
import { configDotenv } from 'dotenv'
import { resolve } from 'path'

export const argv = 'linear'
const getBranchName = async (branch: string, version = 1): Promise<string> => {
  const cur = `${branch}-${version}`;
  const proc = cli(`git branch --list ${cur}`);
  const output = await new Response(proc.stdout).text();
  return output.trim() ? getBranchName(branch, version + 1) : cur
};

export const main = async () => {
  configDotenv({ path: resolve(__dirname, "../../.env"), });
  const argv = parseArgv()
  const number = +(argv.i)
  const _team = argv.t
  if (isNaN(number)) throw new Error("Not found number")
  const team = _team || Bun.env.LINEAR_TEAM
  const client = new LinearClient({ apiKey: Bun.env.LINEAR_PERSONAL_API_KEY })
  const issue = await client.issues({
    filter: { team: { name: { eq: team } }, number: { eq: number } }
  }).then(res => res.nodes.at(0))
  if (!issue) throw new Error(`Not found issue ${number} from ${team}`)
  const branchName = await getBranchName(issue.branchName)
  cli(`git checkout main`)
  cli(`git pull`)
  cli(`git checkout -b ${branchName}`)
}


if (import.meta.path === Bun.main) {
  main()
  // this script is being directly executed
} else {
  // this file is being imported from another script
}
