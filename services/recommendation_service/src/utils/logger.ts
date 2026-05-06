import type { Request } from "express";

enum LogLevel {
  INFO = "INFO",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
  WARN = "WARN",
}

interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatContext(context: LogContext): string {
    const parts = [];
    if (context.requestId) parts.push(`[${context.requestId}]`);
    if (context.method && context.endpoint)
      parts.push(`${context.method} ${context.endpoint}`);
    if (context.userId) parts.push(`User: ${context.userId}`);
    if (context.statusCode) parts.push(`Status: ${context.statusCode}`);
    return parts.length > 0 ? parts.join(" ") : "";
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: unknown
  ): void {
    const timestamp = this.formatTimestamp();
    const contextStr = context ? this.formatContext(context) : "";
    const errorStack =
      error instanceof Error && level === LogLevel.ERROR ? `\n${error.stack}` : "";

    const logEntry = `${timestamp} [${level}] ${message} ${contextStr}${errorStack}`;
    console.log(logEntry);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  public error(message: string, error?: unknown, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  public logRequest(req: Request): LogContext {
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const context: LogContext = {
      requestId,
      method: req.method,
      endpoint: req.path,
      userId: req.query.userId as string | undefined,
    };
    this.info("Request received", context);
    return context;
  }

  public logResponse(message: string, statusCode: number, context: LogContext): void {
    this.info(message, { ...context, statusCode });
  }

  public logProcessing(message: string, context: LogContext): void {
    this.debug(`Processing: ${message}`, context);
  }
}

export const logger = new Logger();
export type { LogContext };
