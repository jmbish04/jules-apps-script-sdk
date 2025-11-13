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
  },

  /**
   * Expose predicates for developers to use
   */
  until: {
    planGenerated: (act: Activity) => !!act.planGenerated,
    completed: (act: Activity) => !!act.sessionCompleted,
    failed: (act: Activity) => !!act.sessionFailed,
    finished: (act: Activity) => !!act.sessionCompleted || !!act.sessionFailed,
    messaged: (act: Activity) => !!act.agentMessaged,
  },

  /**
   * Monitors a session and triggers a callback for EACH new activity.
   *
   * @param sessionIdOrName The session ID.
   * @param onActivity A callback arrow function. Return `true` to stop monitoring.
   * @param options Configuration for timeout and polling speed.
   */
  monitor: (
    sessionIdOrName: string,
    onActivity: (activity: Activity) => boolean | void,
    { timeoutMs = 300000, intervalMs = 3000 }: { timeoutMs?: number; intervalMs?: number } = {}
  ): void => {
    const sessionName = Client.normalizeId(sessionIdOrName, 'sessions');
    const startTime = Date.now();

    // IN-MEMORY STATE: Start looking for events from "now" (minus small buffer)
    let lastSeenIso = new Date(Date.now() - 2000).toISOString();

    console.log(`[JulesApp] Monitoring ${sessionName} (Max: ${timeoutMs / 1000}s)...`);

    while (Date.now() - startTime < timeoutMs) {
      // 1. Fetch recent activities (fetch last 20 to be safe)
      const response = JulesApp.listSessionActivities(sessionName, 20);
      const activities = response.activities || [];

      // 2. Sort chronological (Oldest -> Newest) so the callback fires in order
      // Note: Date.parse handles ISO strings in V8 perfectly
      activities.sort((a, b) => Date.parse(a.createTime) - Date.parse(b.createTime));

      // 3. Process new items
      for (const act of activities) {
        // Only process if strictly newer than what we've processed
        if (act.createTime > lastSeenIso) {

          // Trigger the developer's callback
          const shouldStop = onActivity(act);

          // Update high-water mark immediately
          lastSeenIso = act.createTime;

          // If callback returned true, exit the monitor loop entirely
          if (shouldStop === true) {
            return;
          }
        }
      }

      // 4. Wait before next poll
      Utilities.sleep(intervalMs);
    }

    console.log('[JulesApp] Monitor timed out.');
  },

  /**
   * Helper: specific implementation of waitFor using the monitor engine
   */
  waitFor: (
    sessionIdOrName: string,
    predicate: (act: Activity) => boolean,
    timeoutMs: number = 60000
  ): Activity => {
    let result: Activity | null = null;

    JulesApp.monitor(sessionIdOrName, (act) => {
      if (predicate(act)) {
        result = act;
        return true; // Stop monitoring
      }
      return false;
    }, { timeoutMs });

    if (!result) throw new Error(`Timed out waiting for condition.`);
    return result;
  }
};
