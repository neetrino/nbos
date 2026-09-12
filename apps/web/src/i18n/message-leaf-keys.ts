/** Dotted leaf paths of a nested message catalog. */
export type MessageLeafKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : MessageLeafKeys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
