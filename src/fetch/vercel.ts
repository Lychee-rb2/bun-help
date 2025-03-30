import { Vercel } from "@vercel/sdk";

export const createVercelClient = (token: string) =>
  new Vercel({ bearerToken: token, timeoutMs: 5000 });
