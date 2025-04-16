import { getProjects } from "@@/fetch/vercel.ts";
import { checkbox, select } from "@inquirer/prompts";
import { DeployHook as _DeployHook, Project } from "@@/types/vercel.ts";

type DeployHook = _DeployHook & {
  projectName: Project["name"];
};
export default async function () {
  const { get } = getProjects();
  const projects = await get();

  const map = projects.reduce<Record<string, DeployHook[]>>(
    (acc, { link, name }) => {
      link?.deployHooks.forEach((deployHook) => {
        const branch = deployHook.ref;
        acc[branch] = acc[branch] || [];
        acc[branch].push({ ...deployHook, projectName: name });
      });
      return acc;
    },
    {},
  );
  const branch = await select({
    message: "Release which branch?",
    choices: Object.entries(map).map(([branch, deployHooks]) => ({
      name: branch,
      value: branch,
      description: deployHooks.map((i) => i.projectName).join(", "),
    })),
    loop: false,
  });
  const answer = await checkbox({
    message: "Release which project?",
    loop: false,
    choices: map[branch]
      .map((deployHook) => ({
        name: `${deployHook.projectName}`,
        value: deployHook,
        checked: true,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  });
  await Promise.all(answer.map(({ url }) => fetch(url)));
}
