export const cli = (cmd: string) => {
  const proc = Bun.spawnSync(cmd.split(' '));
  if (!proc.success) {
    console.error(cmd)
    throw new Error(proc.stderr.toString())
  }
  console.log(proc.stdout.toString())
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
