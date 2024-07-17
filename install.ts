import dotenv from 'dotenv'
const env = await Bun.file("./.env").text()
const content = `
declare namespace NodeJS {
  export interface ProcessEnv {
    ${Object.keys( dotenv.parse(env)).map(key=> `${key}?: string`).join('\n    ')}
  }
}
`
await Bun.write('./global-env.d.ts', content)

