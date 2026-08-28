import "server-only";

type LogDetails = Record<string, unknown>;

export function serverError(scope: string, details: LogDetails) {
  process.stderr.write(`[${scope}] ${JSON.stringify(details)}\n`);
}
