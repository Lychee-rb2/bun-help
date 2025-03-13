import { getIssues } from '@/fetch/linear.ts'
import { cli, parseArgv, tempFile, typedBoolean, z, } from '@/help'
import { Issue } from '@linear/sdk'
import dayjs from 'dayjs'

const validate = z.object({
  team: z.string(),
  organization: z.string(),
  repo: z.string(),
  target: z.string(),
  main: z.string()
})
const parsePr = (pr: string) => {
  const matcher = pr.match(/\((#[0-9]*)\)$/)
  if (!matcher) return (`- ${pr}`)
  return `- [${pr}](https://github.com/${Bun.env.GIT_ORGANIZATION}/${Bun.env.GIT_REPO}/pull/${matcher[1].replace(/^#/, '')})`
}
export default async function () {
  const argv = parseArgv()
  const day = dayjs().format('YYYY_MM_DD')
  const { team, main, target } = validate.parse({
    team: Bun.env.LINEAR_TEAM,
    organization: Bun.env.GIT_ORGANIZATION,
    repo: Bun.env.GIT_REPO,
    target: argv.t || "release",
    main: argv.m || "main"
  })
  cli(['git', 'pull'])
  const behind = cli(['git', 'log', '--oneline', '--graph', '--abbrev-commit', target, '..', main, '--no-decorate']).stdout.toString().split('\n').filter(Boolean).map(i => i.slice(11).trim())
  const ahead = cli(['git', 'log', '--oneline', '--graph', '--abbrev-commit', main, '..', target, '--no-decorate']).stdout.toString().split('\n').filter(Boolean).map(i => i.slice(11).trim())
  ahead.forEach(title => {
    const index = behind.findIndex(v => title === v)
    if (index === -1) {
      // throw Error(`${title} is not in ${main}`)
    } else {
      behind.splice(index, 1)
    }
  })
  const reg = /^(feat|fix)\(.*-(.*)\):/
  const pr2Issue: Record<string, number[]> = {}
  const issue2Pr: Record<string, string[]> = {}
  behind.forEach(title => {
    const matcher = title.match(reg)
    if (!matcher) return
    const n = matcher[2]
    if (!n) return
    const issues = n.split('/').map(i => +i).filter(typedBoolean)
    pr2Issue[title] = issues
    issues.forEach(issue => {
      issue2Pr[issue] = issue2Pr[issue] || []
      issue2Pr[issue].push(title)
    })
  })

  const issueMap = await getIssues({
    team,
    numbers: Object.keys(issue2Pr).map(i => +i)
  }).then(res => res.reduce((pre, cur) => {
    pre.set(cur.number, cur)
    return pre
  }, new Map<number, Issue>()))

  const results: {
    issue: Issue,
    prs: string[]
  }[] = []
  issueMap.forEach((issue, number) => {
    const prs = issue2Pr[number]
    const item = results.find(i => i.issue.number === number)
    if (!item) {
      results.push({ issue, prs })
    } else {
      item.prs.push(...prs)
    }
  })
  const others: string[] = Object.keys(pr2Issue).filter(pr => !results.map(i => i.prs).flat().includes(pr))

  const note = results.sort((a, b) => a.issue.number - b.issue.number).reduce<string[]>((pre, cur) => {
    pre.push(`### ${team}-${cur.issue.number}`)
    pre.push(`[${cur.issue.title}](${cur.issue.url})`)
    pre.push(' ')
    cur.prs.forEach((pr) => {
      pre.push(parsePr(pr))
    })
    pre.push(' ')
    return pre
  }, [`# Release note: ${day}`, `## Diff ${target} and ${main}`])
  if (others.length) {
    note.push(...[`### Others`, ...others.map(pr => parsePr(pr)), ''])
  }
  const path = await tempFile(`${target}-${main}-${day}.md`, note.join('\n'))
  cli(['open', path])
}
