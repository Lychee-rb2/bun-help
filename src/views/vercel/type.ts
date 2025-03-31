import type { DeploymentMeta } from "@/types/vercel";
import type { Vercel } from "@vercel/sdk";

type ValueOf<T> = T[keyof T];

export type Project_ = Awaited<
  ReturnType<Vercel["projects"]["getProjects"]>
>["projects"][number];

export type Target_ = ValueOf<NonNullable<Project_["targets"]>>;

export type DeployHook_ = (Project_["link"] & {
  type: "github";
})["deployHooks"][number];

export type DeployHook = Pick<DeployHook_, "ref" | "url">;

export type Project = Pick<Project_, "id" | "name" | "targets"> & {
  link: { deployHooks: DeployHook[] };
  targets: { [k: string]: Pick<Target_, "id"> };
};

export type Deployment_ = Awaited<
  ReturnType<Vercel["deployments"]["getDeployments"]>
>["deployments"][number];

export type Deployment = Pick<
  Deployment_,
  "created" | "buildingAt" | "ready" | "state" | "uid" | "inspectorUrl"
> & {
  meta: Pick<
    DeploymentMeta,
    "githubCommitRef" | "githubCommitMessage" | "branchAlias"
  >;
};

export type Target = "preview" | "production";
