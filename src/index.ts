export * from './expression';
export {
  Flag,
  /* These types are exported for the convenience of custom extensions */
  type RegExpToken,
  type LiteralFunction,
  type GenericFunction,
  type NumberFunction,
  type TokenFunction,
  type MultiTokenFunction,
  type GroupFunction,
  type AlternationFunction,
  type NamedCaptureFunction,
  type RepeatFunction,
  type LimitFunction,
  type CharClassFunction,
  type IncompleteToken,
} from './types';
