import { describe, it, expect, vi, beforeEach } from 'vitest';
import './mocks'; // MUST import this first to set up global.UrlFetchApp
import { JulesApp } from '../src/index'; // Imports your library source
import { mockUrlFetchApp } from './mocks';

describe('JulesApp SDK', () => {
  const API_KEY = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    JulesApp.setApiKey(API_KEY);
  });

  describe('createSession', () => {
    it('should make a POST request to /sessions with correct headers', () => {
      // 1. Setup the Mock Response
      const mockResponse = {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          name: 'sessions/123',
          id: '123',
          state: 'QUEUED'
        })
      };
      mockUrlFetchApp.fetch.mockReturnValue(mockResponse);

      // 2. Call your library
      const result = JulesApp.createSession({
        prompt: 'Fix bug',
        sourceContext: { source: 'sources/github/a/b' }
      });

      // 3. Assertions
      expect(result.id).toBe('123');

      // Verify the underlying API call
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        'https://jules.googleapis.com/v1alpha/sessions',
        expect.objectContaining({
          method: 'post',
          headers: { 'X-Goog-Api-Key': API_KEY },
          payload: expect.stringContaining('"prompt":"Fix bug"')
        })
      );
    });

    it('should throw a readable error on 400 Bad Request', () => {
      // 1. Mock a failure
      mockUrlFetchApp.fetch.mockReturnValue({
        getResponseCode: () => 400,
        getContentText: () => JSON.stringify({
          error: { message: 'Invalid Source' }
        })
      });

      // 2. Expect it to throw
      expect(() => {
        JulesApp.createSession({ prompt: 'foo', sourceContext: { source: 'bad' } } as any);
      }).toThrow('JulesApp API Error [400]: Invalid Source');
    });
  });

  describe('getSession', () => {
    it('should normalize ID and fetch', () => {
      mockUrlFetchApp.fetch.mockReturnValue({
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({ name: 'sessions/abc' })
      });

      // Pass "abc", expect "sessions/abc"
      JulesApp.getSession('abc');

      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        'https://jules.googleapis.com/v1alpha/sessions/abc',
        expect.anything()
      );
    });
  });
});
