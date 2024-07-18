import { LinearClient } from '@linear/sdk'

export const getIssue = async ({ team, number }: { team: string, number: number }) => {
  const client = new LinearClient({ apiKey: Bun.env.LINEAR_PERSONAL_API_KEY })
  const res = await client.issues({
    filter: { team: { name: { eq: team } }, number: { eq: number } }
  })
  return res.nodes.at(0)
}
