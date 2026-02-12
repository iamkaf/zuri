import type { ZuriApi } from './preload';

declare global {
  interface Window {
    zuri: ZuriApi;
  }
}

export {};
