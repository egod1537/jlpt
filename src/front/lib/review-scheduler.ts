import type { Rating, StudyRecord } from "@/lib/types";

export const DAY_MS = 86_400_000;
const TEN_MINUTES_MS = 600_000;

export function initialRecord(wordId: string): StudyRecord {
  return { wordId, repetitions: 0, intervalDays: 0, easeFactor: 2.5, dueAt: null, lastReviewedAt: null, lastRating: null, lapses: 0 };
}

export function schedule(previousValue: StudyRecord | undefined, rating: Rating, now: Date): StudyRecord {
  const previous = previousValue ?? initialRecord("");
  let repetitions = previous.repetitions;
  let intervalDays = previous.intervalDays;
  let easeFactor = previous.easeFactor;
  let lapses = previous.lapses;
  let dueAt: string;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = 0;
    lapses += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    dueAt = new Date(now.getTime() + TEN_MINUTES_MS).toISOString();
  } else if (rating === "hard") {
    repetitions += 1;
    intervalDays = Math.max(1, Math.ceil(Math.max(1, intervalDays) * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    dueAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
  } else if (rating === "good") {
    intervalDays = previous.repetitions === 0 ? 1 : previous.repetitions === 1 ? 3 : Math.max(1, Math.ceil(Math.max(1, intervalDays) * easeFactor));
    repetitions += 1;
    dueAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
  } else {
    intervalDays = previous.repetitions === 0 ? 3 : Math.max(1, Math.ceil(Math.max(1, intervalDays) * easeFactor * 1.3));
    repetitions += 1;
    easeFactor = Math.min(3, easeFactor + 0.1);
    dueAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
  }
  return { ...previous, repetitions, intervalDays, easeFactor, dueAt, lastReviewedAt: now.toISOString(), lastRating: rating, lapses };
}
