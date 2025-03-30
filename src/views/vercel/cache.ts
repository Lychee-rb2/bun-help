import { Vercel } from "@vercel/sdk";
import * as vscode from "vscode";
import { Deployment, Project } from "./type";
interface ProjectsCache {
  data: Project[];
  t: number;
}
export class VercelProjectsCache {
  private cacheTime = 1000 * 60 * 60 * 24;
  private config = vscode.workspace.getConfiguration("lychee-quick");
  private cacheKey: string;

  constructor(
    public context: vscode.ExtensionContext,
    public client: Vercel,
  ) {
    this.cacheKey = `vercelProjectsCache-${this.config.get<string>("vercelTeam")}-projects`;
  }
  private async fetchVercelProjects(): Promise<Project[]> {
    const team = this.config.get<string>("vercelTeam");
    console.log("vercelTeam");
    if (!team) {
      throw new Error("Vercel team is not set");
    }
    return this.client.projects
      .getProjects({ teamId: team })
      .then((res) => res.projects as Project[])
      .catch((e) => {
        console.log(e);
        throw e;
      });
  }

  async getProjects() {
    const cachedData = this.context.globalState.get<ProjectsCache>(
      this.cacheKey,
    );
    if (cachedData && Date.now() - cachedData.t < this.cacheTime) {
      return cachedData.data;
    }
    const cache = {
      data: await this.fetchVercelProjects(),
      t: Date.now(),
    } satisfies ProjectsCache;
    await this.context.globalState.update(this.cacheKey, cache);
    return cache.data;
  }

  async clear() {
    await this.context.globalState.update(this.cacheKey, undefined);
  }
}

interface DeploymentsCache {
  data: Record<string, Deployment[]>;
  t: number;
}

export class VercelDeploymentsCache {
  private cacheTime = 1000 * 60 * 3;
  private config = vscode.workspace.getConfiguration("lychee-quick");
  private cacheKey: string;

  constructor(
    public context: vscode.ExtensionContext,
    public client: Vercel,
    public project: Project,
  ) {
    this.cacheKey = `vercelProjectsCache-${this.config.get<string>("vercelTeam")}-${project.id}-deployments`;
  }

  private async fetchDeployments(
    team: string,
  ): Promise<DeploymentsCache["data"]> {
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
            .then((res) => res.deployments as Deployment[]),
        ),
      )
    )
      .flat()
      .sort((a, b) => b.created - a.created)
      .reduce<DeploymentsCache["data"]>((pre, cur) => {
        const key = cur.meta?.githubCommitRef;
        if (key) {
          pre[key] = pre[key] || [];
          pre[key].push(cur);
        }
        return pre;
      }, {});
  }

  private async fetchVercelDeployments(): Promise<DeploymentsCache["data"]> {
    const team = this.config.get<string>("vercelTeam");
    if (!team) {
      throw new Error("Vercel team is not set");
    }
    return this.fetchDeployments(team);
  }
  async getDeployments() {
    const cachedData = this.context.globalState.get<DeploymentsCache>(
      this.cacheKey,
    );
    if (cachedData && Date.now() - cachedData.t < this.cacheTime) {
      return cachedData.data;
    }
    const cache = {
      data: await this.fetchVercelDeployments(),
      t: Date.now(),
    } satisfies DeploymentsCache;

    await this.context.globalState.update(this.cacheKey, cache);
    return cache.data;
  }

  async clear() {
    await this.context.globalState.update(this.cacheKey, undefined);
  }
}
