import { Client } from './client';
import {
  CreateSessionRequest,
  Session,
  ListResponse,
  Activity,
  Source
} from './types';

/**
 * Configuration
 */
export const setApiKey = (key: string) => Client.setApiKey(key);

/**
 * --- SOURCES ---
 */
export const listSources = (pageSize: number = 10, pageToken?: string): ListResponse<Source> => {
  let query = `?pageSize=${pageSize}`;
  if (pageToken) query += `&pageToken=${pageToken}`;
  return Client.fetch<ListResponse<Source>>(`sources${query}`, 'get');
};

export const getSource = (idOrName: string): Source => {
  const name = Client.normalizeId(idOrName, 'sources');
  return Client.fetch<Source>(name, 'get');
};

/**
 * --- SESSIONS ---
 */
export const createSession = (config: CreateSessionRequest): Session => {
  return Client.fetch<Session>('sessions', 'post', config);
};

export const getSession = (idOrName: string): Session => {
  const name = Client.normalizeId(idOrName, 'sessions');
  return Client.fetch<Session>(name, 'get');
};

export const listSessions = (pageSize: number = 10, pageToken?: string): ListResponse<Session> => {
  let query = `?pageSize=${pageSize}`;
  if (pageToken) query += `&pageToken=${pageToken}`;
  return Client.fetch<ListResponse<Session>>(`sessions${query}`, 'get');
};

/**
 * --- ACTIVITIES ---
 */
export const listSessionActivities = (sessionIdOrName: string, pageSize: number = 30): ListResponse<Activity> => {
  const sessionName = Client.normalizeId(sessionIdOrName, 'sessions');
  const query = `?pageSize=${pageSize}`;
  return Client.fetch<ListResponse<Activity>>(`${sessionName}/activities${query}`, 'get');
};

export const getActivity = (activityIdOrName: string): Activity => {
  return Client.fetch<Activity>(activityIdOrName, 'get');
};

/**
 * --- ACTIONS ---
 */
export const approvePlan = (sessionIdOrName: string): void => {
  const name = Client.normalizeId(sessionIdOrName, 'sessions');
  Client.fetch(`${name}:approvePlan`, 'post', {});
};

export const sendMessage = (sessionIdOrName: string, message: string): void => {
  const name = Client.normalizeId(sessionIdOrName, 'sessions');
  Client.fetch(`${name}:sendMessage`, 'post', { prompt: message });
};

/**
 * --- HELPERS ---
 */

// Export 'until' as a standalone object property
export const until = {
  planGenerated: (act: Activity) => !!act.planGenerated,
  completed: (act: Activity) => !!act.sessionCompleted,
  failed: (act: Activity) => !!act.sessionFailed,
  finished: (act: Activity) => !!act.sessionCompleted || !!act.sessionFailed,
  messaged: (act: Activity) => !!act.agentMessaged
};

export const monitor = (
  sessionIdOrName: string,
  onActivity: (activity: Activity) => boolean | void,
  { timeoutMs = 300000, intervalMs = 3000 }: { timeoutMs?: number; intervalMs?: number } = {}
): void => {
  const sessionName = Client.normalizeId(sessionIdOrName, 'sessions');
  const startTime = Date.now();
  let lastSeenIso = new Date(Date.now() - 2000).toISOString();

  console.log(`[JulesApp] Monitoring ${sessionName} (Max: ${timeoutMs / 1000}s)...`);

  while (Date.now() - startTime < timeoutMs) {
    // Call the exported function directly (no 'JulesApp.' prefix needed inside the module)
    const response = listSessionActivities(sessionName, 20);
    const activities = response.activities || [];

    activities.sort((a, b) => Date.parse(a.createTime) - Date.parse(b.createTime));

    for (const act of activities) {
      if (act.createTime > lastSeenIso) {
        const shouldStop = onActivity(act);
        lastSeenIso = act.createTime;
        if (shouldStop === true) {
          return;
        }
      }
    }
    Utilities.sleep(intervalMs);
  }
  console.log('[JulesApp] Monitor timed out.');
};

export const waitFor = (
  sessionIdOrName: string,
  predicate: (act: Activity) => boolean,
  timeoutMs: number = 60000
): Activity => {
  let result: Activity | null = null;

  // Call monitor directly
  monitor(sessionIdOrName, (act) => {
    if (predicate(act)) {
      result = act;
      return true;
    }
    return false;
  }, { timeoutMs });

  if (!result) throw new Error(`Timed out waiting for condition.`);
  return result;
};
