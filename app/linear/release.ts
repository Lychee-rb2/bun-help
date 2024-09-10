import { cli, parseArgv, tempFile, typedBoolean, z, } from '@/help'
import { getIssues } from '@/fetch/linear.ts'
import { Issue } from '@linear/sdk'
import dayjs from 'dayjs'

const validate = z.object({
  team: z.string(),
  target: z.string(),
  main: z.string()
})
export default async function () {
  const argv = parseArgv()
  const day = dayjs().format('YYYY_MM_DD')
  const { team, main, target } = validate.parse({
    team: Bun.env.LINEAR_TEAM,
    target: argv.t || "release",
    main: argv.m || "main"
  })
  const behind = cli(`git log --oneline --graph --abbrev-commit ${target}..${main} --no-decorate`).stdout.toString().split('\n').filter(Boolean).map(i => i.slice(11))
  const ahead = cli(`git log --oneline --graph --abbrev-commit ${main}..${target} --no-decorate`).stdout.toString().split('\n').filter(Boolean).map(i => i.slice(11))
  ahead.forEach(title => {
    const index = behind.findIndex(v => title === v)
    if (index === -1) {
      throw Error(`${title}在main中不存在`)
    } else {
      behind.splice(index, 1)
    }
  })
  const reg = /^(feat|fix)\(JOGG-(.*)\):/
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
    pre.push(`### JOGG-${cur.issue.number}`)
    pre.push(`[${cur.issue.title}](${cur.issue.url})`)
    pre.push(' ')
    cur.prs.forEach((pr) => {
      const matcher = pr.match(/\((#[0-9]*)\)$/)
      if (matcher) {
        pre.push(`- [${pr}](https://github.com/joggroup/jog-monorepo/pull/${matcher[1]})`)
      } else {
        pre.push(`- ${pr}`)
      }
    })
    pre.push(' ')
    return pre
  }, [`# Release note: ${day}`, `## Diff ${target} and ${main}`])
  if (others.length) {
    note.push(...[`### Others`, ...others.map(pr => {
      const matcher = pr.match(/\((#[0-9]*)\)$/)
      if (matcher) {
        return (`- [${pr}](https://github.com/joggroup/jog-monorepo/pull/${matcher[1]})`)
      } else {
        return (`- ${pr}`)
      }
    }), ''])
  }
  const path = await tempFile(`${target}-${main}-${day}.md`, note.join('\n'))
  cli(`open ${path}`)
}