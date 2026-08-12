export interface Onboarding {
  skill: string;
  answers: AgentAnswer[];
}

export interface Resource {
  id: string;
  checkpointId: string;
  kind: "short" | "deep";
  format: "video" | "article";
  title: string;
  url: string;
  durationSec?: number;
  readMinutes?: number;
  source: string;
  author: string;
  authorSignal: string;
  language?: string;
  publishedYear?: number;
  visible: boolean;
  credibility: number;
  credibilityReason: string;
}

export interface MergedCheckpoint {
  id: string;
  order: number;
  title: string;
  why: string;
  skillFocus: string;
}

export type CheckpointStatus = "locked" | "current" | "done";

export interface SavedItem {
  resourceId: string;
  checkpointId: string;
  savedAt: string;
  remindAt: string;
}

export interface AppState {
  onboarding: Onboarding | null;
  path: GeneratedPath | null;
  progress: Record<string, CheckpointStatus>;
  saved: SavedItem[];
  draft: { skill: string; questions: AgentQuestion[] } | null;
}

// --- Agent (Phase 2): dynamic, skill-agnostic generation ---

export interface AgentQuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface AgentQuestion {
  id: string;
  prompt: string;
  options: AgentQuestionOption[];
}

export interface AgentAnswer {
  questionId: string;
  optionId: string;
  label: string;
}

export interface GeneratedResource {
  kind: "short" | "deep";
  format: "video" | "article";
  title: string;
  url: string;
  source: string;
  author: string;
  authorSignal: string;
  language?: string;
  durationSec?: number;
  readMinutes?: number;
  publishedYear?: number;
  credibility: number;
  credibilityReason: string;
}

export interface GeneratedCheckpoint {
  order: number;
  title: string;
  why: string;
  skillFocus: string;
  resources: GeneratedResource[];
}

export interface GeneratedPath {
  skill: string;
  checkpoints: GeneratedCheckpoint[];
}
