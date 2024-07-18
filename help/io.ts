import { logger } from 'help'
import dotenv from 'dotenv'

export const cli = (cmd: string) => {
  const proc = Bun.spawnSync(cmd.split(' '));
  if (!proc.success) {
    logger.error(cmd)
    throw new Error(proc.stderr.toString())
  }
  return proc
}

export const parseArgv = () =>
  Bun.argv.reduce<Record<string, string>>((pre, cur) => {
    const matcher = cur.match(/-(.+)=(.+)/)
    if (matcher) {
      pre[matcher[1]] = matcher[2]
    }
    return pre
  }, {})

export const pbcopy = (data: string) => {
  const proc = Bun.spawn(['pbcopy'], { stdin: "pipe" })
  proc.stdin.write(data);
  proc.stdin.end();
  logger.info(`\n${data}`)
}

const _require = (actionName: string[]) => {
  const actionPath = `@/app/${actionName.join('/')}`
  try {
    return require(actionPath);
  } catch (e) {
    throw new Error(`Can't find action "${actionName.join(' ')}"`)
  }
}

export const main = async (meta: ImportMeta) => {
  dotenv.config({ path: `${meta.dir}/.env` })
  const binIndex = Bun.argv.findIndex(i => i === meta.path)
  if (binIndex === -1) {
    throw new Error("Parse argv fail")
  }
  const actionName = Bun.argv.slice(binIndex + 1).filter(i => !i.includes('-'))
  const action = await _require(actionName);
  if (action.default) {
    logger.debug(`Start run "${actionName.join(' ')}"`)
    await action.default()
    logger.debug(`End run "${actionName.join(' ')}"`)
  } else {
    logger.error(`Does not find "${actionName.join(' ')}"`)
  }
}
