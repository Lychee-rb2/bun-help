import { getDeployments, getProjects } from '@/fetch/vercel.ts'
import { ago, getBranch, z } from '@/help'
import { sleep } from 'bun'
import Stdout from 'help/stdout.ts'
import preview from './preview'

import notifier from 'node-notifier'

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
  const poll = (app: string, notify = false) =>
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
          await poll(app, true)
          break
        case "CANCELED":
          notify && notifier.notify(`${app} ${deployment.meta.githubCommitRef} cancel!`);
          break
        case "ERROR":
          notify && notifier.notify(`${app} ${deployment.meta.githubCommitRef} error!`);
          break
        case "READY":
          notify && notifier.notify(`${app} ${deployment.meta.githubCommitRef} ready!`);
          break
      }
    }).catch(async (e: Error)=>{
      log.update(app, [emoji.INIT, e.message])
      notify && notifier.notify(`${app} ${e.message}!`);
      await sleep(10000)
      await poll(app, true)
    })
  await Promise.all(projects.map(i => poll(i)))
  await preview({ from: "check" })
}
