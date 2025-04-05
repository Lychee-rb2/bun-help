import { Vercel } from "@vercel/sdk";

import mapValues from "lodash-es/mapValues";
import pick from "lodash-es/pick";

let vercel: Vercel | null = null;
export const createVercelClient = (token: string) => {
  if (vercel) return vercel;
  vercel = new Vercel({ bearerToken: token, timeoutMs: 5000 });
  return vercel;
};

export const getProjects = (token: string, teamId: string) =>
  createVercelClient(token)
    .projects.getProjects({ teamId })
    .then((res) =>
      res.projects.map((project) => ({
        ...pick(project, ["id", "name"]),
        link: {
          deployHooks: project.link.deployHooks.map((deployHook) =>
            pick(deployHook, ["ref", "url"]),
          ),
        },
        targets: mapValues(project.targets, (target) => pick(target, ["id"])),
      })),
    );

export const getDeployments = async (
  token: string,
  teamId: string,
  projectId: string,
) => {
  const client = createVercelClient(token);
  return (
    await Promise.all(
      [
        { limit: 5, target: "production" },
        { limit: 15, target: "preview" },
      ].map((option) =>
        client.deployments
          .getDeployments({
            teamId,
            projectId,
            state: "BUILDING,QUEUED,READY,ERROR",
            ...option,
          })
          .then((res) => res.deployments),
      ),
    )
  ).flat();
};
