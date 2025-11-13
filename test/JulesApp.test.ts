import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUrlFetchApp, mockPropertiesService } from './mocks'; // Import the new mock
import * as JulesApp from '../src/index';

describe('JulesApp Auth Resolution', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the internal config of the library implicitly by not calling setApiKey yet
    // We can clear it by setting it to empty string if the implementation allows,
    // but since _config is module-level, we need to be careful.
    // The implementation does `_config = { apiKey: key }`.
    // To "unset" it effectively for the tests, we can pass a key but we want to test the NULL case.
    // Ideally we would expose a reset method, but for now let's assume we start fresh or can override.

    // Wait! The module state persists across tests in the same file.
    // We must ensure we clear the config.
    // Let's assume we can "reset" by setting it to empty string, BUT the logic is `if (_config && _config.apiKey)`.
    // So `apiKey: ''` is falsy, which falls through to properties.
    JulesApp.setApiKey('');
  });

  it('should use Script Properties if no setApiKey is called', () => {
    // 1. Setup Property Mock
    const mockProps = mockPropertiesService.getScriptProperties();
    mockProps.getProperty.mockReturnValue('PROP_KEY_123');

    // 2. Setup Fetch Mock
    mockUrlFetchApp.fetch.mockReturnValue({
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ id: '123' })
    });

    // 3. Call createSession WITHOUT setApiKey (we cleared it in beforeEach)
    JulesApp.createSession({ prompt: 'foo', sourceContext: { source: 'sources/s' } });

    // 4. Expect fetch to use the property key
    expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'X-Goog-Api-Key': 'PROP_KEY_123' }
      })
    );
  });

  it('should prioritize setApiKey over Script Properties', () => {
    // 1. Setup Property Mock (Should be ignored)
    const mockProps = mockPropertiesService.getScriptProperties();
    mockProps.getProperty.mockReturnValue('PROP_KEY_123');

    // 2. Explicitly set key
    JulesApp.setApiKey('EXPLICIT_KEY_999');

    // 3. Setup Fetch Mock
    mockUrlFetchApp.fetch.mockReturnValue({
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ id: '123' })
    });

    JulesApp.createSession({ prompt: 'foo', sourceContext: { source: 'sources/s' } });

    // 4. Expect fetch to use the explicit key
    expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'X-Goog-Api-Key': 'EXPLICIT_KEY_999' }
      })
    );
  });

  it('should throw if neither are present', () => {
    // 1. Ensure Property returns null
    const mockProps = mockPropertiesService.getScriptProperties();
    mockProps.getProperty.mockReturnValue(null);

    // 2. Ensure Config is null (cleared in beforeEach)

    expect(() => {
      JulesApp.createSession({ prompt: 'foo', sourceContext: { source: 'sources/s' } });
    }).toThrow('API Key missing');
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
