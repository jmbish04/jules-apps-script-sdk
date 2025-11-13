// test/mocks.ts
import { vi } from 'vitest';

export const mockUrlFetchApp = {
  fetch: vi.fn(),
};

// Attach to the global scope so "UrlFetchApp" exists when your library runs
global.UrlFetchApp = mockUrlFetchApp as any;

// Mock other GAS services if needed
global.Utilities = {
  base64Encode: (str: string) => Buffer.from(str).toString('base64'),
} as any;
