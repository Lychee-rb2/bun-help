import { getDeployments, getProjects } from "@/fetch/vercel";
import { EXTENSION } from "@/help";
import { type Cache, cacheClient } from "@/help/cache";
import pick from "lodash-es/pick";
import * as vscode from "vscode";
import { Deployment, Project } from "./type";

export const vercelProjectCache = (): Cache<Project[]> => {
  const config = vscode.workspace.getConfiguration(EXTENSION);
  const cacheKey = `vercel-${config.get<string>("vercelTeam")}-projects`;

  const cache = cacheClient(1000 * 60 * 60 * 24, async () => {
    const team = config.get<string>("vercelTeam");
    const token = config.get<string>("vercelToken");
    if (!team) throw new Error("Vercel team is not set");
    if (!token) throw new Error("Vercel token is not set");
    return getProjects(token, team);
  });
  let projects: Project[] = [];
  return {
    get: async () => {
      if (projects.length) return projects;
      projects = await cache.then((cache) => cache.get(cacheKey));
      return projects;
    },
    remove: async () => {
      projects = [];
      return cache.then((cache) => cache.remove(cacheKey));
    },
  };
};

export const vercelDeploymentsCache = (
  project: Project,
): Cache<Record<string, Deployment[]>> => {
  const config = vscode.workspace.getConfiguration(EXTENSION);
  const cacheKey = `vercel-${config.get<string>("vercelTeam")}-${project.id}-deployments`;

  const cache = cacheClient(1000 * 60 * 3, async () => {
    const team = config.get<string>("vercelTeam");
    const token = config.get<string>("vercelToken");
    if (!team) throw new Error("Vercel team is not set");
    if (!token) throw new Error("Vercel token is not set");
    return getDeployments(token, team, project.id).then((res) =>
      res
        .sort((a, b) => b.created - a.created)
        .map((deployment) => ({
          ...pick(deployment, [
            "created",
            "buildingAt",
            "ready",
            "state",
            "uid",
            "inspectorUrl",
          ]),
          meta: pick(deployment.meta, [
            "githubCommitRef",
            "githubCommitMessage",
            "branchAlias",
          ]),
        }))
        .reduce((pre, cur) => {
          const key = cur.meta?.githubCommitRef;
          if (key) {
            pre[key] = pre[key] || [];
            pre[key].push(cur);
          }
          return pre;
        }, {}),
    );
  });
  let deployments: Record<string, Deployment[]> = {};
  return {
    get: async () => {
      if (Object.keys(deployments).length) return deployments;
      deployments = await cache.then((cache) => cache.get(cacheKey));
      return deployments;
    },
    remove: async () => {
      deployments = {};
      return cache.then((cache) => cache.remove(cacheKey));
    },
  };
};
