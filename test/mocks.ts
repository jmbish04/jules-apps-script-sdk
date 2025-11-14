// test/mocks.ts
import { vi } from 'vitest';

export const mockUrlFetchApp = {
  fetch: vi.fn(),
};

// Mock the PropertiesService chain
export const mockPropertiesService = {
  getScriptProperties: vi.fn().mockReturnValue({
    getProperty: vi.fn(),
    setProperty: vi.fn(),
    deleteAllProperties: vi.fn(),
  }),
};

// Attach to the global scope so "UrlFetchApp" exists when your library runs
global.UrlFetchApp = mockUrlFetchApp as any;
global.PropertiesService = mockPropertiesService as any;
global.Logger = {
  log: console.log as any,
  getLog: () => "",
  clear: console.clear,
};

// Mock other GAS services if needed
global.Utilities = {
  base64Encode: (str: string) => Buffer.from(str).toString('base64'),
  sleep: (ms: number) => {}, // Mock sleep for monitor/polling tests
} as any;
