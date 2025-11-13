export interface JulesConfig {
  apiKey: string;
}

/**
 * API Request/Response Interfaces
 */

export interface SourceContext {
  source: string; // e.g., "sources/github/owner/repo"
  githubRepoContext?: {
    startingBranch: string;
  };
}

export interface CreateSessionRequest {
  prompt: string;
  sourceContext: SourceContext;
  title?: string;
  requirePlanApproval?: boolean;
  automationMode?: 'AUTOMATION_MODE_UNSPECIFIED' | 'AUTO_CREATE_PR';
}

export interface Session {
  name: string; // "sessions/{id}"
  id: string;
  title: string;
  state: 'QUEUED' | 'PLANNING' | 'AWAITING_PLAN_APPROVAL' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'STATE_UNSPECIFIED';
  prompt: string;
  createTime: string;
  updateTime: string;
  url: string;
  outputs?: Array<{ pullRequest?: { url: string; title: string } }>;
}

export interface Activity {
  name: string;
  id: string;
  description: string;
  createTime: string;
  originator: 'agent' | 'user' | 'system';

  // Union fields
  agentMessaged?: { agentMessage: string };
  userMessaged?: { userMessage: string };
  planGenerated?: { plan: { id: string; steps: Array<{ title: string; description: string }> } };
  progressUpdated?: { title: string; description: string };
  sessionCompleted?: {};
  sessionFailed?: { reason: string };

  artifacts?: Artifact[];
}

export interface Artifact {
  changeSet?: { source: string; gitPatch: { unidiffPatch: string; suggestedCommitMessage: string } };
  bashOutput?: { command: string; output: string; exitCode: number };
  media?: { data: string; mimeType: string };
}

export interface ListResponse<T> {
  sessions?: T[];
  sources?: T[];
  activities?: T[];
  nextPageToken?: string;
}

export interface Source {
  name: string;
  id: string;
  githubRepo?: {
    owner: string;
    repo: string;
    defaultBranch?: { displayName: string };
  };
}
