import { sleep } from "bun";

export const retry = async <T>(
  fn: () => Promise<T>,
  n = 3,
  sleepTime = 500,
): Promise<T> => {
  try {
    return fn();
  } catch (e) {
    if (n === 0) {
      console.log(`Retry fail`);
      throw e;
    } else {
      console.log(e);
      console.log(`Retry it, sleep ${sleepTime}ms, the rest time ${n}`);
      await sleep(sleepTime);
      return retry<T>(fn, n - 1);
    }
  }
};

export const _fetch = (url: string, init?: RequestInit) =>
  retry(() =>
    fetch(
      url,
      init
        ? { signal: AbortSignal.timeout(3000), ...init }
        : { signal: AbortSignal.timeout(3000) },
    ),
  );
