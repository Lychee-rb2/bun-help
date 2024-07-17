import { configDotenv } from 'dotenv';
import { cli, ifArgv, pbcopy } from 'help/io.ts'
import { resolve } from 'path'

const template = (branch: string, names: string[], team: string) => {
  const data = names.map(name => ({
    name: name.replace(/-/g, ' '),
    link: `https://${name}-git-${branch}-${team}.vercel.app`
  }));
  const maxLength = (['name', 'link'] as const).map(k => Math.max(...data.map(i => i[k].length)) + 5)
  return data.map(({
    name,
    link
  }) => [name.padEnd(maxLength[0]), link.padEnd(maxLength[1])].join('')).join('\n')
}

export const argv = 'vercel'
export const main = async () => {
  configDotenv({ path: resolve(__dirname, "../../.env"), });
  const preview = ifArgv('-p')
  const team = Bun.env.VERCEL_TEAM
  if (preview && team) {
    const names = await fetch(`https://api.vercel.com/v9/projects?teamId=${team}`, {
      "headers": { "Authorization": `Bearer ${Bun.env.VERCEL_PERSONAL_TOKEN}` },
    }).then(res => res.json())
      .then((res: { projects: Project[] }) => res.projects.map(i => i.name))

    const proc = cli(`git branch --show-current`);
    const branch = await new Response(proc.stdout).text().then(t => t.trim().replace(/\//g, "-").replace(/_/g, ""));
    const output = template(branch, names, team)
    pbcopy(output)
  }
}

if (import.meta.path === Bun.main) {
  main()
  // this script is being directly executed
} else {
  // this file is being imported from another script
}
