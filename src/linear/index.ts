import { LinearClient } from '@linear/sdk'
import { cli, parseArgv } from '../../help/io.ts'

const numberReg = /-i=([0-9]+)/
const teamReg = /-t=(.+)/
const argv = parseArgv()
const number = +(argv.i)
const _team = argv.t
if (isNaN(number)) {
  throw new Error("Not found number")
}
const team = _team|| Bun.env.LINEAR_TEAM
const client = new LinearClient({ apiKey: Bun.env.LINEAR_PERSONAL_API_KEY })
const issue = await client.issues({
  filter: {
    team: { name: { eq: team } }, number: { eq: number }
  }
}).then(res => res.nodes.at(0))
if (!issue){
  throw new Error(`Not found issue ${number} from ${team}`)
}
const getBranchName = (branch: string, version = 1): string => {
  const cur = `${branch}-${version}`;
  const proc = cli(`git branch --list '${cur}*'`);
  const list = proc.stdout.toString()
  return list.trim() ? getBranchName(branch, version + 1) : cur
};
const prefix = issue.branchName?.split('/').at(0) || 'feature'
const identifier = issue.identifier
const branchName = getBranchName(`${prefix}/${identifier}`)
cli(`git checkout main`)
cli(`git pull`)
cli(`git checkout -b ${branchName}`)
