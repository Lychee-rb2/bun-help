import type { DeploymentMeta } from "@/types/vercel";
import type { Vercel } from "@vercel/sdk";

export type Project = Awaited<
  ReturnType<Vercel["projects"]["getProjects"]>
>["projects"][number];

export type DeployHook = (Project["link"] & {
  type: "github";
})["deployHooks"][number];

export type Deployment = Omit<
  Awaited<
    ReturnType<Vercel["deployments"]["getDeployments"]>
  >["deployments"][number],
  "meta"
> & { meta?: DeploymentMeta };

export type Target = "preview" | "production";
