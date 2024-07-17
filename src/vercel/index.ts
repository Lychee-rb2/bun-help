import { configDotenv } from 'dotenv';
import { cli, ifArgv, pbcopy } from 'help/io.ts'
import { resolve } from 'path'

export const argv = 'vercel'
export const main = async () => {
  configDotenv({ path: resolve(__dirname, "../../.env"), });
  const preview = ifArgv('-p')
  const team = Bun.env.VERCEL_TEAM
  const template = (branch: string, names: string[]) => names.map(name => `${name.replace(/-/g, ' ')}: https://${name}-git-${branch}-${team}.vercel.app`).join('\n')
  if (preview) {
    const names = await fetch(`https://api.vercel.com/v9/projects?teamId=${team}`, {
      "headers": { "Authorization": `Bearer ${Bun.env.VERCEL_PERSONAL_TOKEN}` },
    }).then(res => res.json())
      .then((res: { projects: Project[] }) => res.projects.map(i => i.name))
    const proc = cli(`git branch --show-current`);
    const branch = await new Response(proc.stdout).text().then(t => t.trim().replace(/\//g, "-").replace(/_/g, ""));
    const output = template(branch, names)
    pbcopy(output)
  }
}

