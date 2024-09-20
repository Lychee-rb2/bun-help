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

export const ago = (t: number) => {
  const now = new Date().getTime()
  const diff = Math.floor((now - t) / 1000)
  const minutes = `${Math.floor(diff / 60)}`.padStart(2, '0')
  const seconds = `${diff % 60}`.padStart(2, '0')
  return `${minutes}:${seconds}`
}
