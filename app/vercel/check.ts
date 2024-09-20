import { getDeployments, getProjects } from '@/fetch/vercel.ts'
import { ago, getBranch, z } from '@/help'
import { sleep } from 'bun'
import Stdout from 'help/stdout.ts'
import preview from './preview'

const validate = z.object({ team: z.string(), branch: z.string() })
const emoji = {
  PENDING: '⌛️',
  BUILDING: '🔨',
  INITIALIZING: '🔧',
  QUEUED: '🕔',
  CANCELED: '⛔️',
  ERROR: '❌',
  READY: '🚀',
  INIT: "🔄"
}
export default async function () {
  const { team, branch } = validate.parse({ team: Bun.env.VERCEL_TEAM, branch: await getBranch() })
  const projects = await getProjects(team).then((res) => res.projects.map(i => i.name))
  const log = new Stdout(projects)
  projects.forEach(i => log.update(i, [emoji.PENDING, emoji.PENDING]))
  const poll = (app: string) =>
    getDeployments(team, app).then(async res => {
      const deployments = res.deployments.filter(i => i.meta.githubCommitRef === branch)
      const [deployment] = deployments
      if (!deployment) return
      const status = deployment.state
      log.update(app, [emoji[status] + (status === 'BUILDING' ? ago(deployment.buildingAt) : ""), deployment.inspectorUrl])
      switch (status) {
        case "BUILDING":
        case "INITIALIZING":
        case "QUEUED":
          await sleep(10000)
          await poll(app)
          break
        case "CANCELED":
        case "ERROR":
        case "READY":
          break
      }
    })
  await Promise.all(projects.map(i => poll(i)))
  await preview()
}
