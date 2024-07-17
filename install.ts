import dotenv from 'dotenv'

const env = await Bun.file("./.env").text()
const content = `
declare namespace NodeJS {
  export interface ProcessEnv {
    ${Object.keys(dotenv.parse(env)).map(key => `${key}?: string`).join('\n    ')}
  }
}
`
await Bun.write('./global-env.d.ts', content)

const glob = new Bun.Glob("./src/*/index.ts");
const head = `import { ifArgv } from 'help/io.ts'`
const importArr: string[] = []
const runArr: string[] = []
const scripts: Record<string, string> = {}
for await (const file of glob.scan(".")) {
  const matcher = file.match(/\.\/src\/(.+)\/index\.ts/)
  const module = matcher?.at(1)
  if (module) {
    importArr.push(`import { main as ${module} } from '@/src/${module}'`)
    runArr.push(`ifArgv('${module}') && ${module}()`)
    scripts[module] = `bun index.ts -${module}`
  }
}

const installContent = [
  head,
  importArr.join('\n'),
  runArr.join('\n'),
].join('\n\n')
await Bun.write('./index.ts', installContent)

if (Bun.env.CLI_NAME) {
  await Bun.write(`./bin/${Bun.env.CLI_NAME}`, `#!/bin/sh
exec bun "${import.meta.dirname}/index.ts" "$@"
`)
  const zshrc = await Bun.file(`${Bun.env.HOME}/.zshrc`).text()
  const zshrcContent = zshrc.split('\n')
  const alias = `alias ${Bun.env.CLI_NAME}="zsh ${import.meta.dirname}/bin/${Bun.env.CLI_NAME}"`
  if (zshrcContent.some(i => i === alias)) {
    console.log(`zshrc already has ${alias}", skip add`)
  } else {
    await Bun.write(`${Bun.env.HOME}/.zshrc`, `${zshrc}\n${alias}`)
    console.log(`zshrc add "${alias}", use "source ${Bun.env.HOME}/.zshrc"`)
  }
}

