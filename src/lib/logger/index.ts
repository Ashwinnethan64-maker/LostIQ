type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  message: string;
  context?: string;
  data?: Record<string, unknown> | unknown;
  error?: Error | unknown;
}

class Logger {
  private format(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    const ctx = payload.context ? `[${payload.context}]` : '';
    return {
      timestamp,
      level: level.toUpperCase(),
      context: payload.context,
      message: `${timestamp} [${level.toUpperCase()}] ${ctx} ${payload.message}`,
      data: payload.data,
      error: payload.error instanceof Error ? { message: payload.error.message, stack: payload.error.stack } : payload.error,
    };
  }

  info(message: string, context?: string, data?: unknown) {
    const formatted = this.format('info', { message, context, data });
    console.log(formatted.message, data ? JSON.stringify(data) : '');
  }

  warn(message: string, context?: string, data?: unknown) {
    const formatted = this.format('warn', { message, context, data });
    console.warn(formatted.message, data ? JSON.stringify(data) : '');
  }

  error(message: string, context?: string, error?: unknown, data?: unknown) {
    const formatted = this.format('error', { message, context, error, data });
    console.error(formatted.message, error || '', data ? JSON.stringify(data) : '');
  }

  debug(message: string, context?: string, data?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = this.format('debug', { message, context, data });
      console.debug(formatted.message, data ? JSON.stringify(data) : '');
    }
  }
}

export const logger = new Logger();
