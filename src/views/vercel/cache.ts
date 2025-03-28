import { Vercel } from "@vercel/sdk";
import * as vscode from "vscode";
type Project = Awaited<
  ReturnType<Vercel["projects"]["getProjects"]>
>["projects"][number];

interface ProjectsCache {
  projects: Project[];
  t: number;
}
export class VercelProjectsCache {
  private cacheTime = 1000 * 60 * 60 * 24;
  public projects: ProjectsCache["projects"] = [];
  private config = vscode.workspace.getConfiguration("lychee-quick");
  private cacheKey: string;

  constructor(
    public context: vscode.ExtensionContext,
    public client: Vercel,
  ) {
    this.cacheKey = `vercelProjectsCache-${this.config.get<string>("vercelTeam")}`;
  }
  private async fetchVercelProjects(): Promise<Project[]> {
    const team = this.config.get<string>("vercelTeam");
    if (!team) {
      throw new Error("Vercel team is not set");
    }
    return this.client.projects
      .getProjects({ teamId: team })
      .then((res) => res.projects);
  }

  async getProjects() {
    const cachedData = this.context.globalState.get<ProjectsCache>(
      this.cacheKey,
    );
    if (cachedData && Date.now() - cachedData.t < this.cacheTime) {
      return cachedData.projects;
    }
    const data = {
      projects: await this.fetchVercelProjects(),
      t: Date.now(),
    } satisfies ProjectsCache;
    this.projects = data.projects;
    await this.context.globalState.update(this.cacheKey, data);
    return data.projects;
  }

  async clear() {
    await this.context.globalState.update(this.cacheKey, undefined);
  }
}
