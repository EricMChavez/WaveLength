import { describe, it, expect } from 'vitest';
import { ok, err } from './index.ts';
import type { Result } from './index.ts';

describe('Result', () => {
  it('ok() creates a success result', () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(42);
  });

  it('err() creates an error result', () => {
    const result = err('something went wrong');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('something went wrong');
  });

  it('discriminates via ok field', () => {
    const result: Result<number, string> = ok(10);
    if (result.ok) {
      expect(result.value).toBe(10);
    } else {
      throw new Error('should not reach here');
    }
  });

  it('discriminates error via ok field', () => {
    const result: Result<number, string> = err('fail');
    if (!result.ok) {
      expect(result.error).toBe('fail');
    } else {
      throw new Error('should not reach here');
    }
  });
});
