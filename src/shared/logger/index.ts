export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type LogNamespace = 'Graph' | 'CycleRunner' | 'Bake' | 'Render' | 'Save' | 'UI';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

let currentLevel: LogLevel = import.meta.env.DEV ? 'DEBUG' : 'WARN';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function createLogger(namespace: LogNamespace) {
  const prefix = `[${namespace}]`;

  function log(level: LogLevel, ...args: unknown[]): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[currentLevel]) return;
    const method = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : level === 'DEBUG' ? 'debug' : 'log';
    console[method](prefix, ...args);
  }

  return {
    debug: (...args: unknown[]) => log('DEBUG', ...args),
    info: (...args: unknown[]) => log('INFO', ...args),
    warn: (...args: unknown[]) => log('WARN', ...args),
    error: (...args: unknown[]) => log('ERROR', ...args),
  };
}
