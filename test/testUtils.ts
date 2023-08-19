export function assertType<T1, _T2 extends T1>(): void;
export function assertType<T>(_: T): void;
export function assertType<T1>(_?: T1): void {}

assertType<''>('');
assertType<'', ''>();

assertType<'a'>('a');
assertType<'a', 'a'>();

// @ts-expect-error - wrong type
assertType<'a'>('b');
// @ts-expect-error - wrong type
assertType<'a', 'b'>();
