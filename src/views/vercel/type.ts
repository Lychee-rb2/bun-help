import type { Vercel } from "@vercel/sdk";

export type Project = Awaited<
  ReturnType<Vercel["projects"]["getProjects"]>
>["projects"][number];

export type DeployHook = (Project["link"] & {
  type: "github";
})["deployHooks"][number];
