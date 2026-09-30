// Server-side logging. Technical details stay in server logs (Vercel), never in responses.

function serialise(error: unknown): unknown {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  return error;
}

export const log = {
  error(scope: string, error: unknown, context?: Record<string, unknown>) {
    console.error(JSON.stringify({ level: "error", scope, error: serialise(error), ...context }));
  },
  warn(scope: string, message: string, context?: Record<string, unknown>) {
    console.warn(JSON.stringify({ level: "warn", scope, message, ...context }));
  },
  info(scope: string, message: string, context?: Record<string, unknown>) {
    console.info(JSON.stringify({ level: "info", scope, message, ...context }));
  },
};
