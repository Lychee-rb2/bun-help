const foo = await Bun.file("./.env").text()
import dotenv from 'dotenv'
const env = dotenv.parse(foo)
const content = `
declare namespace NodeJS {
  export interface ProcessEnv {
    ${Object.keys(env).map(key=> `${key}?: string\n`)}
  }
}
`
await Bun.write('./global-env.d.ts', content)
