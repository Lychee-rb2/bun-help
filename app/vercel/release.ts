import check from "@/app/vercel/check.ts";
import { getProjects } from "@/fetch/vercel.ts";
import { cli, z } from "@/help";

const validate = z.object({ team: z.string() });

export default async function () {
  const { team } = validate.parse({ team: Bun.env.VERCEL_TEAM });
  const projects = await getProjects(team).then((res) =>
    res.projects
      .map((i) => ({
        link: i.link.deployHooks.find((i) => i.ref === "release"),
        name: i.name,
      }))
      .filter((i) => i.link),
  );
  for (const project of projects) {
    try {
      await fetch(project.link!.url).then((res) => res.json());
    } catch (e) {
      console.log(e);
      console.log(project.name + " release Fail");
    }
  }
  const { success } = cli(["git", "checkout", "release"]);
  if (success) await check();
}
