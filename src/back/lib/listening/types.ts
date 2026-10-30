export type ListeningFolder = {
  id: string;
  parentId: string | null;
  name: string;
  sortIndex: number;
  favorite: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ListeningSetSummary = {
  id: string;
  folderId: string | null;
  title: string;
  description: string;
  sortIndex: number;
  favorite: boolean;
  revision: number;
  audioCount: number;
  durationMs: number;
  lastPlayedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListeningAudio = {
  id: string;
  setId: string;
  originalName: string;
  storedKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  durationMs: number | null;
  sampleRate: number | null;
  channels: number | null;
  codecName: string | null;
  status: string;
  scriptVersionId: string | null;
  favorite: boolean;
  lastPlayedAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ListeningSegment = {
  id: string;
  ordinal: number;
  startMs: number;
  endMs: number;
  speaker: string | null;
  ja: string;
  ko: string | null;
  needsReview: boolean;
  reviewNote: string | null;
  sourceSegmentIds: string[];
};

export type ListeningScriptVersion = {
  id: string;
  audioId: string;
  versionNo: number;
  kind: "whisper_raw" | "gpt_processed" | "manual_edit";
  basedOnId: string | null;
  language: string;
  modelName: string | null;
  promptVersion: string | null;
  createdAt: string;
  segments: ListeningSegment[];
};

export type ListeningJob = {
  id: string;
  audioId: string;
  type: "transcribe" | "gpt_process";
  state: "queued" | "running" | "waiting_auth" | "completed" | "failed" | "canceled";
  stage: string;
  attempt: number;
  maxAttempts: number;
  progress: number;
  inputVersionId: string | null;
  outputVersionId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

