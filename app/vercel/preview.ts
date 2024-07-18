import { getBranch, pbcopy, vercelPreview, z } from 'help'
import { getProjects } from '@/fetch/vercel.ts'

const validate = z.object({ team: z.string() })

export default async function () {
  const { team } = validate.parse({ team: Bun.env.VERCEL_TEAM })
  const names = await getProjects(team).then((res) => res.projects.map(i => i.name))
  const branch = await getBranch()
  const output = vercelPreview(branch, names, team)
  pbcopy(output)
}
