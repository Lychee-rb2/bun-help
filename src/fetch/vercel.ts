import { Vercel } from "@vercel/sdk";
let vercel: Vercel | null = null;
export const createVercelClient = (token: string) => {
  if (vercel) return vercel;
  vercel = new Vercel({ bearerToken: token, timeoutMs: 5000 });
  return vercel;
};
