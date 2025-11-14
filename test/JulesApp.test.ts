import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUrlFetchApp, mockPropertiesService } from './mocks';
import * as JulesApp from '../src/index';
import { Client } from '../src/client';

describe('JulesApp Auth Resolution', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    JulesApp.setApiKey('');
  });

  it('should throw if API Key is not present', () => {
    // Ensure Property returns null
    const mockProps = mockPropertiesService.getScriptProperties();
    mockProps.getProperty.mockReturnValue(null);
    expect(() => {
      JulesApp.createSession({ prompt: 'foo', sourceContext: { source: 'sources/s' } });
    }).toThrow(Client._apiKeyMessage);
  });
});

describe('JulesApp SDK', () => {
  const API_KEY = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    JulesApp.setApiKey(API_KEY);
  });

  describe('createSession', () => {
    it('should make a POST request to /sessions with correct headers', () => {
      const mockResponse = {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          name: 'sessions/123',
          id: '123',
          state: 'QUEUED'
        })
      };
      mockUrlFetchApp.fetch.mockReturnValue(mockResponse);

      const result = JulesApp.createSession({
        prompt: 'Fix bug',
        sourceContext: { source: 'sources/github/a/b' }
      });

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
      // Mock a failure
      mockUrlFetchApp.fetch.mockReturnValue({
        getResponseCode: () => 400,
        getContentText: () => JSON.stringify({
          error: { message: 'Invalid Source' }
        })
      });

      // Expect it to throw
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
