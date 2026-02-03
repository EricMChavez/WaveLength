/** Success variant of Result */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/** Error variant of Result */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/** Discriminated union for typed error handling. Engine functions return this instead of throwing. */
export type Result<T, E = string> = Ok<T> | Err<E>;

/** Create a success Result */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/** Create an error Result */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}
