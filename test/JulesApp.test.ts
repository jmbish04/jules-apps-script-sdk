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
  const BASE_URL = 'https://jules.googleapis.com/v1alpha';


  beforeEach(() => {
    vi.clearAllMocks();
    JulesApp.setApiKey(API_KEY);
  });

  // Helper to mock a successful response
  const mockSuccess = (payload: any) => {
    mockUrlFetchApp.fetch.mockReturnValue({
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify(payload)
    });
  };

  // Helper to mock an error response
  const mockError = (code: number, message: string) => {
    mockUrlFetchApp.fetch.mockReturnValue({
      getResponseCode: () => code,
      getContentText: () => JSON.stringify({ error: { message } })
    });
  };


  describe('createSession', () => {
    it('should POST with the correct payload and return a session', () => {
      const session = { name: 'sessions/123', id: '123', state: 'QUEUED' };
      mockSuccess(session);

      const result = JulesApp.createSession({
        prompt: 'Fix bug',
        sourceContext: { source: 'sources/github/a/b' }
      });

      expect(result).toEqual(session);

      // Verify the underlying API call
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/sessions`,
        expect.objectContaining({
          method: 'post',
          headers: { 'X-Goog-Api-Key': API_KEY },
          payload: expect.stringContaining('"prompt":"Fix bug"')
        })
      );
    });

    it('should throw a readable error on 400 Bad Request', () => {
      mockError(400, 'Invalid Source');
      expect(() => {
        JulesApp.createSession({ prompt: 'foo', sourceContext: { source: 'bad' } } as any);
      }).toThrow('JulesApp API Error [400]: Invalid Source');
    });
  });

  describe('getSession', () => {
    it('should return the session object', () => {
      const session = { name: 'sessions/abc' };
      mockSuccess(session);
      const result = JulesApp.getSession('abc');
      expect(result).toEqual(session);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/sessions/abc`,
        expect.anything()
      );
    });

    it('should throw on API error', () => {
      mockError(404, 'Not Found');
      expect(() => JulesApp.getSession('abc')).toThrow('JulesApp API Error [404]: Not Found');
    });
  });

  describe('listSources', () => {
    it('should return a list of sources', () => {
      const sources = { sources: [{ name: 'sources/a' }, { name: 'sources/b' }] };
      mockSuccess(sources);
      const result = JulesApp.listSources(5, 'token');
      expect(result).toEqual(sources);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/sources?pageSize=5&pageToken=token`,
        expect.anything()
      );
    });

    it('should throw on API error', () => {
      mockError(500, 'Server Error');
      expect(() => JulesApp.listSources()).toThrow('JulesApp API Error [500]: Server Error');
    });
  });

  describe('getSource', () => {
    it('should return the source object', () => {
      const source = { name: 'sources/abc' };
      mockSuccess(source);
      const result = JulesApp.getSource('abc');
      expect(result).toEqual(source);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(`${BASE_URL}/sources/abc`, expect.anything());
    });
  });

  describe('listSessions', () => {
    it('should return a list of sessions', () => {
      const sessions = { sessions: [{ name: 'sessions/a' }] };
      mockSuccess(sessions);
      const result = JulesApp.listSessions(10, 'token2');
      expect(result).toEqual(sessions);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(`${BASE_URL}/sessions?pageSize=10&pageToken=token2`, expect.anything());
    });
  });

  describe('listSessionActivities', () => {
    it('should return a list of activities', () => {
      const activities = { activities: [{ name: 'sessions/s/activities/a' }] };
      mockSuccess(activities);
      const result = JulesApp.listSessionActivities('sess_123', 25);
      expect(result).toEqual(activities);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(`${BASE_URL}/sessions/sess_123/activities?pageSize=25`, expect.anything());
    });
  });

  describe('getActivity', () => {
    it('should return an activity object', () => {
      const activity = { name: 'sessions/s/activities/a' };
      mockSuccess(activity);
      const result = JulesApp.getActivity('sessions/s/activities/a');
      expect(result).toEqual(activity);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(`${BASE_URL}/sessions/s/activities/a`, expect.anything());
    });
  });

  describe('approvePlan', () => {
    it('should not throw on success', () => {
      mockSuccess({});
      JulesApp.approvePlan('sess_456');
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(`${BASE_URL}/sessions/sess_456:approvePlan`, expect.anything());
    });

    it('should throw on API error', () => {
      mockError(403, 'Permission Denied');
      expect(() => JulesApp.approvePlan('sess_456')).toThrow('JulesApp API Error [403]: Permission Denied');
    });
  });

  describe('sendMessage', () => {
    it('should not throw on success', () => {
      mockSuccess({});
      JulesApp.sendMessage('sess_789', 'Hello');
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(`${BASE_URL}/sessions/sess_789:sendMessage`, expect.anything());
    });

    it('should throw on API error', () => {
      mockError(400, 'Invalid session state');
      expect(() => JulesApp.sendMessage('sess_789', 'Hello')).toThrow('JulesApp API Error [400]: Invalid session state');
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
