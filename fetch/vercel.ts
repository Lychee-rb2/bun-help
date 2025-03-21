import { Vercel } from "@vercel/sdk";

const vercelClient = (token: string) => {
  const vercel = new Vercel({
    bearerToken: token,
  });
  return vercel;
};
export const getProjects = (auth: string, teamId: string) => {
  return vercelClient(auth).projects.getProjects({ teamId });
};

export const getDeployments = (auth: string, teamId: string, app?: string) => {
  return vercelClient(auth).deployments.getDeployments({ teamId, app });
};

export const getBranch = (
  auth: string,
  teamId: string,
  branch: string,
  app?: string,
) => {
  return vercelClient(auth).deployments.getDeployments({
    teamId,
    target: branch,
    app,
  });
};

export const getDomains = (auth: string, teamId: string, app: string) => {
  return vercelClient(auth).projects.getProjectDomains({
    idOrName: app,
    teamId,
  });
};
