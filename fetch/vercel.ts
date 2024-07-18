const vercelFetch = <T>(uri: string, init?: FetchRequestInit): Promise<T> => fetch(`https://api.vercel.com${uri}`, {
  ...init,
  headers: {
    Authorization: `Bearer ${Bun.env.VERCEL_PERSONAL_TOKEN}`,
    ...init?.headers || {}
  },
}).then(res => res.json())

export const getProjects = (team: string) =>
  vercelFetch<ProjectsRes>(`/v9/projects?teamId=${team}`)

