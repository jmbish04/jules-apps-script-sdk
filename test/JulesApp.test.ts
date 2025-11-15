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

  describe('listSources', () => {
    it('should paginate and fetch all sources when fetchAll is true', () => {
      const mockResponsePage1 = {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          sources: [{ name: 'sources/1' }, { name: 'sources/2' }],
          nextPageToken: 'page2'
        })
      };
      const mockResponsePage2 = {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          sources: [{ name: 'sources/3' }, { name: 'sources/4' }]
        })
      };
      mockUrlFetchApp.fetch.mockReturnValueOnce(mockResponsePage1).mockReturnValueOnce(mockResponsePage2);

      const result = JulesApp.listSources(2, undefined, true);

      expect(result.sources).toHaveLength(4);
      expect(result.sources.map(s => s.name)).toEqual(['sources/1', 'sources/2', 'sources/3', 'sources/4']);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledTimes(2);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        'https://jules.googleapis.com/v1alpha/sources?pageSize=2',
        expect.anything()
      );
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        'https://jules.googleapis.com/v1alpha/sources?pageSize=2&pageToken=page2',
        expect.anything()
      );
    });
  });

  describe('listSessions', () => {
    it('should paginate and fetch all sessions when fetchAll is true', () => {
      const mockResponsePage1 = {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          sessions: [{ name: 'sessions/1' }, { name: 'sessions/2' }],
          nextPageToken: 'page2'
        })
      };
      const mockResponsePage2 = {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          sessions: [{ name: 'sessions/3' }, { name: 'sessions/4' }]
        })
      };
      mockUrlFetchApp.fetch.mockReturnValueOnce(mockResponsePage1).mockReturnValueOnce(mockResponsePage2);

      const result = JulesApp.listSessions(2, undefined, true);

      expect(result.sessions).toHaveLength(4);
      expect(result.sessions.map(s => s.name)).toEqual(['sessions/1', 'sessions/2', 'sessions/3', 'sessions/4']);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('listSessionActivities', () => {
    it('should paginate and fetch all activities when fetchAll is true', () => {
      const mockResponsePage1 = {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          activities: [{ name: 'activities/1' }, { name: 'activities/2' }],
          nextPageToken: 'page2'
        })
      };
      const mockResponsePage2 = {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          activities: [{ name: 'activities/3' }, { name: 'activities/4' }]
        })
      };
      mockUrlFetchApp.fetch.mockReturnValueOnce(mockResponsePage1).mockReturnValueOnce(mockResponsePage2);

      const result = JulesApp.listSessionActivities('sessions/123', 2, undefined, true);

      expect(result.activities).toHaveLength(4);
      expect(result.activities.map(a => a.name)).toEqual(['activities/1', 'activities/2', 'activities/3', 'activities/4']);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
