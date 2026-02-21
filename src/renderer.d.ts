import type { ZuriApi } from './preload';

declare global {
  interface Window {
    zuri: ZuriApi;
  }
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

export {};
