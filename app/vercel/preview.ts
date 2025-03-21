import { getProjects } from "@/fetch/vercel.ts";
import { getBranch, pbcopy, vercelPreview, z } from "help";

const validate = z.object({ team: z.string() });

export default async function (_?: { from?: string }) {
  const { team } = validate.parse({ team: Bun.env.VERCEL_TEAM });
  console.log(Bun.env.VERCEL_PERSONAL_TOKEN);
  const names = await getProjects(Bun.env.VERCEL_PERSONAL_TOKEN!, team).then(
    (res) => res.projects.map((i) => i.name),
  );
  const branch = await getBranch().then((t) =>
    t.trim().replace(/\//g, "-").replace(/_/g, ""),
  );
  const output = vercelPreview(branch, names, team);
  pbcopy(output);
}
