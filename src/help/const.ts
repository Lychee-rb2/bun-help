export const extension = "lychee-quick";
export const LINEAR_VIEW = "linear-view";
export const VERCEL_VIEW = "vercel-view";
export const treeId = (
  view: typeof LINEAR_VIEW | typeof VERCEL_VIEW,
  name: string,
) => `${extension}.${view}.${name}`;
