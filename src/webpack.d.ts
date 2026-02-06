// Webpack require.context API
interface RequireContext {
  keys(): string[];
  (id: string): unknown;
}

declare namespace NodeJS {
  interface Require {
    context(
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp
    ): RequireContext;
  }
}
