import { Client } from './client';

export function setApiKey(apiKey: string) {
  Client.setApiKey(apiKey);
}

/**
 * Lists all available sources.
 *
 * @param {number} pageSize - The maximum number of sources to return.
 * @param {string} [pageToken] - A page token, received from a previous `listSources` call.
 * @param {boolean} [fetchAll=false] - Whether to fetch all pages.
 * @returns {ListResponse<Source>} - A list of sources.
 */
export function listSources(
  pageSize: number = 10,
  pageToken?: string,
  fetchAll: boolean = false
): ListResponse<Source> {
  if (!fetchAll) {
    let query = `?pageSize=${pageSize}`;
    if (pageToken) query += `&pageToken=${pageToken}`;
    return Client.fetch<ListResponse<Source>>(`sources${query}`, 'get');
  }

  let allSources: Source[] = [];
  let currentPageToken: string | undefined = pageToken;

  do {
    let query = `?pageSize=${pageSize}`;
    if (currentPageToken) query += `&pageToken=${currentPageToken}`;
    const response = Client.fetch<ListResponse<Source>>(`sources${query}`, 'get');
    if (response.sources) {
      allSources = allSources.concat(response.sources);
    }
    currentPageToken = response.nextPageToken;
  } while (currentPageToken);

  return { sources: allSources };
}

export function getSource(idOrName: string): Source {
  const name = Client.normalizeId(idOrName, 'sources');
  return Client.fetch<Source>(name, 'get');
}

export function createSession(config: CreateSessionRequest): Session {
  return Client.fetch<Session>('sessions', 'post', config);
}

export function getSession(idOrName: string): Session {
  const name = Client.normalizeId(idOrName, 'sessions');
  return Client.fetch<Session>(name, 'get');
}

/**
 * Lists all sessions.
 *
 * @param {number} pageSize - The maximum number of sessions to return.
 * @param {string} [pageToken] - A page token, received from a previous `listSessions` call.
 * @param {boolean} [fetchAll=false] - Whether to fetch all pages.
 * @returns {ListResponse<Session>} - A list of sessions.
 */
export function listSessions(
  pageSize: number = 10,
  pageToken?: string,
  fetchAll: boolean = false
): ListResponse<Session> {
  if (!fetchAll) {
    let query = `?pageSize=${pageSize}`;
    if (pageToken) query += `&pageToken=${pageToken}`;
    return Client.fetch<ListResponse<Session>>(`sessions${query}`, 'get');
  }

  let allSessions: Session[] = [];
  let currentPageToken: string | undefined = pageToken;

  do {
    let query = `?pageSize=${pageSize}`;
    if (currentPageToken) query += `&pageToken=${currentPageToken}`;
    const response = Client.fetch<ListResponse<Session>>(`sessions${query}`, 'get');
    if (response.sessions) {
      allSessions = allSessions.concat(response.sessions);
    }
    currentPageToken = response.nextPageToken;
  } while (currentPageToken);

  return { sessions: allSessions };
}

/**
 * --- ACTIVITIES ---
 */
/**
 * Lists all activities for a session.
 *
 * @param {string} sessionIdOrName - The session ID or name.
 * @param {number} pageSize - The maximum number of activities to return.
 * @param {string} [pageToken] - A page token, received from a previous `listSessionActivities` call.
 * @param {boolean} [fetchAll=false] - Whether to fetch all pages.
 * @returns {ListResponse<Activity>} - A list of activities.
 */
export function listSessionActivities(
  sessionIdOrName: string,
  pageSize: number = 30,
  pageToken?: string,
  fetchAll: boolean = false
): ListResponse<Activity> {
  const sessionName = Client.normalizeId(sessionIdOrName, 'sessions');

  if (!fetchAll) {
    let query = `?pageSize=${pageSize}`;
    if (pageToken) query += `&pageToken=${pageToken}`;
    return Client.fetch<ListResponse<Activity>>(`${sessionName}/activities${query}`, 'get');
  }

  let allActivities: Activity[] = [];
  let currentPageToken: string | undefined = pageToken;

  do {
    let query = `?pageSize=${pageSize}`;
    if (currentPageToken) query += `&pageToken=${currentPageToken}`;
    const response = Client.fetch<ListResponse<Activity>>(`${sessionName}/activities${query}`, 'get');
    if (response.activities) {
      allActivities = allActivities.concat(response.activities);
    }
    currentPageToken = response.nextPageToken;
  } while (currentPageToken);

  return { activities: allActivities };
}

export function getActivity(activityIdOrName: string): Activity {
  return Client.fetch<Activity>(activityIdOrName, 'get');
}

/**
 * --- ACTIONS ---
 */
export function approvePlan(sessionIdOrName: string): void {
  const name = Client.normalizeId(sessionIdOrName, 'sessions');
  Client.fetch(`${name}:approvePlan`, 'post', {});
}

export function sendMessage(sessionIdOrName: string, message: string): void {
  const name = Client.normalizeId(sessionIdOrName, 'sessions');
  Client.fetch(`${name}:sendMessage`, 'post', { prompt: message });
}

export const until = {
  planGenerated: (act: Activity) => !!act.planGenerated,
  completed: (act: Activity) => !!act.sessionCompleted,
  failed: (act: Activity) => !!act.sessionFailed,
  finished: (act: Activity) => !!act.sessionCompleted || !!act.sessionFailed,
  messaged: (act: Activity) => !!act.agentMessaged
}

export function monitor(
  sessionIdOrName: string,
  onActivity: (activity: Activity) => boolean | void,
  { timeoutMs = 300000, intervalMs = 3000 }: { timeoutMs?: number; intervalMs?: number } = {}
): void {
  const sessionName = Client.normalizeId(sessionIdOrName, 'sessions');
  const startTime = Date.now();
  let lastSeenIso = new Date(Date.now() - 2000).toISOString();
  Logger.log(`[JulesApp] Monitoring ${sessionName} (Max: ${timeoutMs / 1000}s)...`);

  while (Date.now() - startTime < timeoutMs) {
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
  Logger.log('[JulesApp] Monitor timed out.');
}

export function waitFor(
  sessionIdOrName: string,
  predicate: (act: Activity) => boolean,
  timeoutMs: number = 60000
): Activity {
  let result: Activity | null = null;
  monitor(sessionIdOrName, (act) => {
    if (predicate(act)) {
      result = act;
      return true;
    }
    return false;
  }, { timeoutMs });

  if (!result) throw new Error(`Timed out waiting for condition.`);
  return result;
}
