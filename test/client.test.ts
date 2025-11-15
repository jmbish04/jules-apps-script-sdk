import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUrlFetchApp } from './mocks';
import { Client } from '../src/client';

describe('Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Client.setApiKey('test-key');
  });

  describe('normalizeId', () => {
    it('should add prefix if missing', () => {
      const result = Client.normalizeId('123', 'sessions');
      expect(result).toBe('sessions/123');
    });

    it('should not add prefix if present', () => {
      const result = Client.normalizeId('sessions/123', 'sessions');
      expect(result).toBe('sessions/123');
    });
  });

  describe('fetch', () => {
    it('should handle non-JSON error responses', () => {
      mockUrlFetchApp.fetch.mockReturnValue({
        getResponseCode: () => 500,
        getContentText: () => 'Internal Server Error'
      });

      expect(() => {
        Client.fetch('test', 'get');
      }).toThrow('JulesApp API Error [500]: Internal Server Error');
    });
  });
});
