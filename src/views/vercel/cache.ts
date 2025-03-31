import { EXTENSION } from "@/help";
import { cacheClient, type Cache } from "@/help/cache";
import { Vercel } from "@vercel/sdk";
import mapValues from "lodash-es/mapValues";
import pick from "lodash-es/pick";
import * as vscode from "vscode";
import { Deployment, Project } from "./type";
import type { VercelTreeDataProvider } from "./view";
export class VercelProjectsCache {
  private cacheTime = 1000 * 60 * 60 * 24;
  private config = vscode.workspace.getConfiguration(EXTENSION);
  private cacheKey: string;
  private cache: Promise<Cache<Project[]>>;
  private client: Vercel;

  constructor(public context: vscode.ExtensionContext) {
    this.client = new Vercel({ bearerToken: this.config.get("vercelToken") });
    this.cacheKey = `vercel-${this.config.get<string>("vercelTeam")}-projects`;
    this.cache = cacheClient(this.context, this.cacheTime, () =>
      this.fetchVercelProjects(),
    );
  }
  private async fetchVercelProjects(): Promise<Project[]> {
    const team = this.config.get<string>("vercelTeam");
    if (!team) throw new Error("Vercel team is not set");
    return this.client.projects.getProjects({ teamId: team }).then((res) =>
      res.projects.map((project) => {
        return {
          ...pick(project, ["id", "name"]),
          link: {
            deployHooks: project.link.deployHooks.map((deployHook) =>
              pick(deployHook, ["ref", "url"]),
            ),
          },
          targets: mapValues(project.targets, (target) => pick(target, ["id"])),
        };
      }),
    );
  }

  async getProjects() {
    return (await this.cache).get(this.cacheKey);
  }

  async clear() {}
}

export class VercelDeploymentsCache {
  private cacheTime = 1000 * 60 * 3;
  private config = vscode.workspace.getConfiguration(EXTENSION);
  private cacheKey: string;
  private cache: Promise<Cache<Record<string, Deployment[]>>>;
  private client: Vercel;

  constructor(
    provider: VercelTreeDataProvider,
    public project: Project,
  ) {
    this.client = new Vercel({ bearerToken: this.config.get("vercelToken") });
    this.cacheKey = `vercel-${this.config.get<string>("vercelTeam")}-${project.id}-deployments`;
    this.cache = cacheClient(provider.context, this.cacheTime, () =>
      this.fetchVercelDeployments(),
    );
  }

  private async fetchDeployments(
    team: string,
  ): Promise<Record<string, Deployment[]>> {
    return (
      await Promise.all(
        [
          { limit: 5, target: "production" },
          { limit: 15, target: "preview" },
        ].map((option) =>
          this.client.deployments
            .getDeployments({
              teamId: team,
              projectId: this.project.id,
              state: "BUILDING,QUEUED,READY,ERROR",
              ...option,
            })
            .then((res) => res.deployments),
        ),
      )
    )
      .flat()
      .sort((a, b) => b.created - a.created)
      .map((project) => ({
        ...pick(project, [
          "created",
          "buildingAt",
          "ready",
          "state",
          "uid",
          "inspectorUrl",
        ]),
        meta: pick(project.meta, [
          "githubCommitRef",
          "githubCommitMessage",
          "branchAlias",
        ]),
      }))
      .reduce<Record<string, Deployment[]>>((pre, cur) => {
        const key = cur.meta?.githubCommitRef;
        if (key) {
          pre[key] = pre[key] || [];
          pre[key].push(cur);
        }
        return pre;
      }, {});
  }

  private async fetchVercelDeployments(): Promise<
    Record<string, Deployment[]>
  > {
    const team = this.config.get<string>("vercelTeam");
    if (!team) throw new Error("Vercel team is not set");
    return this.fetchDeployments(team);
  }
  async getDeployments() {
    return (await this.cache).get(this.cacheKey);
  }

  async clear() {
    return (await this.cache).remove(this.cacheKey);
  }
}
