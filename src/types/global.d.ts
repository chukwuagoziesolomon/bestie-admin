import { Cleanup } from '../utils/sessionManager';

declare global {
  interface Window {
    sessionManagerCleanup?: Cleanup;
  }
}

export {};
