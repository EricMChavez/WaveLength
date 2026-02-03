import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger, setLogLevel } from './index.ts';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setLogLevel('DEBUG');
  });

  it('logs with namespace prefix', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = createLogger('Graph');
    logger.info('test message');
    expect(spy).toHaveBeenCalledWith('[Graph]', 'test message');
  });

  it('uses correct console methods per level', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const logger = createLogger('WTS');
    logger.error('err');
    logger.warn('wrn');
    logger.debug('dbg');

    expect(errorSpy).toHaveBeenCalledWith('[WTS]', 'err');
    expect(warnSpy).toHaveBeenCalledWith('[WTS]', 'wrn');
    expect(debugSpy).toHaveBeenCalledWith('[WTS]', 'dbg');
  });

  it('filters messages below current level', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    setLogLevel('WARN');
    const logger = createLogger('Render');
    logger.debug('should not appear');
    logger.info('should not appear');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('allows messages at or above current level', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    setLogLevel('WARN');
    const logger = createLogger('Save');
    logger.warn('warning');
    logger.error('error');

    expect(warnSpy).toHaveBeenCalledWith('[Save]', 'warning');
    expect(errorSpy).toHaveBeenCalledWith('[Save]', 'error');
  });
});
