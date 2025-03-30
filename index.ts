import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({ bearerToken: Bun.env.VERCEL_PERSONAL_TOKEN! });
vercel.projects
  .getProjects({
    teamId: "jog",
  })
  .then((res) => {
    Bun.write("./projects.json", JSON.stringify(res.projects[0]));
  });
