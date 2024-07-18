const logLevel = Bun.env.LOG_LEVEL || "debug"
import pino, { type BaseLogger } from 'pino'

export let logger: BaseLogger
export const createLogger = () => {
  if (logger) return logger
  logger = pino({
    level: logLevel,
    transport: {
      target: 'pino-pretty'
    },
  })
  return logger
}
