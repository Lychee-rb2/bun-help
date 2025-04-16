const logLevel = Bun.env.LOG_LEVEL || "info";
import pino, { type BaseLogger } from "pino";

export let logger: BaseLogger;
export const createLogger = () => {
  if (logger) return logger;
  logger = pino({
    level: logLevel,
    transport: { targets: [{ target: "pino-pretty" }] },
  });
  return logger;
};
