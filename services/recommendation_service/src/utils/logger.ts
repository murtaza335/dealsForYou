type LogLevel = "debug" | "info" | "warn" | "error";

function now() {
  return new Date().toISOString();
}

function shouldLog(level: LogLevel) {
  const envLevel = (process.env.LOG_LEVEL || "debug").toLowerCase();
  const order: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
  return order[level] >= order[envLevel as LogLevel];
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (!shouldLog("debug")) return;
    console.debug("[DEBUG]", now(), ...args);
  },
  info: (...args: unknown[]) => {
    if (!shouldLog("info")) return;
    console.log("[INFO]", now(), ...args);
  },
  warn: (...args: unknown[]) => {
    if (!shouldLog("warn")) return;
    console.warn("[WARN]", now(), ...args);
  },
  error: (...args: unknown[]) => {
    if (!shouldLog("error")) return;
    console.error("[ERROR]", now(), ...args);
  },
};

export default logger;
