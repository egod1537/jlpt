export type StudySessionProgress = {
  wordIds: string[];
  queue?: string[];
  position: number;
};

export function remainingStudyWordIds(session: StudySessionProgress) {
  return session.queue?.length ? session.queue : session.wordIds.slice(session.position || 0);
}

export function isResumableStudySession(session: StudySessionProgress) {
  return remainingStudyWordIds(session).length > 0;
}

export function studySessionProgress(session: StudySessionProgress | undefined, total: number) {
  if (!session) return 0;
  const remaining = new Set(remainingStudyWordIds(session)).size;
  return Math.max(0, Math.min(total, total - remaining));
}
