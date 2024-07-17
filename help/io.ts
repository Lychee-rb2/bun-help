export const cli = (cmd: string) => {
  const proc = Bun.spawnSync(cmd.split(' '));
  if (!proc.success) {
    console.error(cmd)
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

export const ifArgv = (key: string) => Bun.argv.some(i => i.startsWith(`-${key}`))

export const pbcopy = (data: string) => {
  const proc =  Bun.spawn(['pbcopy'], {stdin:"pipe"})
  proc.stdin.write(data);
  proc.stdin.end();
  console.log(data)
}
