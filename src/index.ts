import { Client } from './client';
import {
  CreateSessionRequest,
  Session,
  ListResponse,
  Activity,
  Source
} from './types';

/**
 * JulesApp SDK for Google Apps Script
 * A wrapper around the Jules REST API.
 */
export const JulesApp = {

  /**
   * Configuration
   */
  setApiKey: (key: string) => Client.setApiKey(key),

  /**
   * --- SOURCES ---
   */

  listSources: (pageSize: number = 10, pageToken?: string): ListResponse<Source> => {
    let query = `?pageSize=${pageSize}`;
    if (pageToken) query += `&pageToken=${pageToken}`;
    return Client.fetch<ListResponse<Source>>(`sources${query}`, 'get');
  },

  getSource: (idOrName: string): Source => {
    const name = Client.normalizeId(idOrName, 'sources');
    return Client.fetch<Source>(name, 'get');
  },

  /**
   * --- SESSIONS ---
   */

  createSession: (config: CreateSessionRequest): Session => {
    return Client.fetch<Session>('sessions', 'post', config);
  },

  getSession: (idOrName: string): Session => {
    const name = Client.normalizeId(idOrName, 'sessions');
    return Client.fetch<Session>(name, 'get');
  },

  listSessions: (pageSize: number = 10, pageToken?: string): ListResponse<Session> => {
    let query = `?pageSize=${pageSize}`;
    if (pageToken) query += `&pageToken=${pageToken}`;
    return Client.fetch<ListResponse<Session>>(`sessions${query}`, 'get');
  },

  /**
   * --- ACTIVITIES ---
   */

  listSessionActivities: (sessionIdOrName: string, pageSize: number = 30): ListResponse<Activity> => {
    const sessionName = Client.normalizeId(sessionIdOrName, 'sessions');
    const query = `?pageSize=${pageSize}`;
    return Client.fetch<ListResponse<Activity>>(`${sessionName}/activities${query}`, 'get');
  },

  getActivity: (activityIdOrName: string): Activity => {
    // Note: Activity names are nested: sessions/X/activities/Y
    // If the user passes a raw ID, we cannot easily normalize it without the parent session ID.
    // We assume if it doesn't start with 'sessions/', it might be a raw ID,
    // but constructing the full path is ambiguous.
    // For the MVP, we expect the full resource name or strict usage.
    return Client.fetch<Activity>(activityIdOrName, 'get');
  },

  /**
   * --- ACTIONS ---
   */

  approvePlan: (sessionIdOrName: string): void => {
    const name = Client.normalizeId(sessionIdOrName, 'sessions');
    Client.fetch(`${name}:approvePlan`, 'post', {});
  },

  sendMessage: (sessionIdOrName: string, message: string): void => {
    const name = Client.normalizeId(sessionIdOrName, 'sessions');
    Client.fetch(`${name}:sendMessage`, 'post', { prompt: message });
  }
};
