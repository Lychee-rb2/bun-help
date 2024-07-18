import dotenv from 'dotenv'
import { resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
const path = (p: string) => resolve(root, p)
const env = await Bun.file("./.env").text()
const content = `
declare namespace NodeJS {
  export interface ProcessEnv {
    ${Object.keys(dotenv.parse(env)).map(key => `${key}?: string`).join('\n    ')}
  }
}
`
await Bun.write('./global-env.d.ts', content)

if (Bun.env.ZSH) {
  if (Bun.env.CLI_NAME) {
    const BIN_PATH = `./bin/bun-help`
    await Bun.write(BIN_PATH, `#!/bin/sh
exec bun "${path("./bin.ts")}" "$@"
`)
    const zshrc = await Bun.file(`${Bun.env.HOME}/.zshrc`).text()
    const zshrcContent = zshrc.split('\n')
    const alias = `alias ${Bun.env.CLI_NAME}="zsh ${path(BIN_PATH)}"`
    if (zshrcContent.some(i => i === alias)) {
      console.log(`zshrc already has ${alias}", skip add`)
    } else {
      await Bun.write(`${Bun.env.HOME}/.zshrc`, `${zshrc}\n${alias}`)
      console.log(`zshrc add "${alias}", use "source ${Bun.env.HOME}/.zshrc"`)
    }
  } else {
    console.log("You can add CLI_NAME into your env and run `postinstall` again to use alias")
  }
} else {
  console.log("CLI only support ZSH now.")
}

