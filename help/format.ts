export const vercelPreview = (branch: string, names: string[], team: string) => {
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
