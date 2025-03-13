import { getIssue } from '@/fetch/linear.ts'
import { cli, findNextBranch, numString, parseArgv, z } from 'help'

const validate = z.object({
  team: z.string(), number: numString()
})

export default async function () {
  const argv = parseArgv()
  const { number, team } = validate.parse({
    team: Bun.env.LINEAR_TEAM,
    number: argv.i
  })
  const issue = await getIssue({ team, number })
  if (!issue) throw new Error(`Not found issue ${number} from ${team}`)
  const branchName = await findNextBranch(issue.branchName)
  cli(['git', 'checkout', 'main'])
  cli(['git', 'pull'])
  cli(['git', 'checkout', '-b', branchName])
}
