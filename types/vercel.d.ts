interface Project {
  name: string
  link: {
    deployHooks: {
      createdAt: number,
      id: string,
      name: string,
      ref: "main" | "release",
      url: string,
    }[]
  }
}

interface ProjectsRes {
  projects: Project[]

}
