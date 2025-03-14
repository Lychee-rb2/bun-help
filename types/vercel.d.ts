interface Project {
  name: string;
  link: {
    deployHooks: {
      createdAt: number;
      id: string;
      name: string;
      ref: "main" | "release";
      url: string;
    }[];
  };
}

interface ProjectsRes {
  projects: Project[];
}

interface Deployment {
  uid: string;
  name: string;
  url: string; //"jeanscentre-niszefhvk-jog.vercel.app",
  created: number;
  source: string;
  state:
    | "BUILDING"
    | "ERROR"
    | "INITIALIZING"
    | "QUEUED"
    | "READY"
    | "CANCELED";
  readyState: string;
  type: string;
  creator: {
    uid: string;
    email: string;
    username: string;
    githubLogin: string;
  };
  inspectorUrl: string; // "https://vercel.com/jog/jeanscentre/2QK6hHwABkXK1Mio1MqYY2MoPBn7",
  meta: {
    githubCommitRef: string;
  };
  target: "production" | "preview";
  createdAt: number;
  buildingAt: number;
  ready: number;
}

interface DeploymentsRes {
  deployments: Deployment[];
}
