export type StudyQueueRating = "again" | "hard" | "good" | "easy";

export function nextStudyQueue(queue: string[], currentWordId: string, rating: StudyQueueRating, loopMode: boolean) {
  const rest = queue.slice(1);
  const repeat = loopMode && (rating === "again" || rating === "hard");
  if (!repeat || rest.includes(currentWordId)) return rest;
  return [...rest, currentWordId];
}
