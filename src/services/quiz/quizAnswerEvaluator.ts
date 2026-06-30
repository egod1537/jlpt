import type {
  AnswerResult,
  QuizQuestion,
  UserAnswer,
  WrongAnswerRecord,
} from "../../types/quiz";

export function getCorrectAnswer(question: QuizQuestion): string {
  if (question.answerChoiceIds !== undefined) {
    return question.answerChoiceIds
      .map(
        (choiceId) =>
          question.choices.find((choice) => choice.id === choiceId)?.text ??
          choiceId,
      )
      .join(" / ");
  }

  return (
    question.choices.find((choice) => choice.id === question.answerChoiceId)
      ?.text ?? question.answerChoiceId
  );
}

export function evaluateAnswer(
  question: QuizQuestion,
  answer: UserAnswer,
): AnswerResult {
  const selectedChoiceIds = answer.selectedChoiceIds ?? answer.selectedPieceIds;
  let isCorrect = false;

  if (question.answerChoiceIds !== undefined) {
    isCorrect =
      selectedChoiceIds !== undefined &&
      question.answerChoiceIds.length === selectedChoiceIds.length &&
      question.answerChoiceIds.every(
        (choiceId, index) => choiceId === selectedChoiceIds[index],
      );
  } else if (answer.selectedChoiceId !== undefined) {
    isCorrect = answer.selectedChoiceId === question.answerChoiceId;
  } else if (answer.inputAnswer !== undefined) {
    isCorrect = answer.inputAnswer.trim() === getCorrectAnswer(question).trim();
  }

  return {
    isCorrect,
    selectedChoiceId: answer.selectedChoiceId,
    selectedChoiceIds,
    selectedPieceIds: answer.selectedPieceIds,
    inputAnswer: answer.inputAnswer,
    correctAnswer: getCorrectAnswer(question),
    explanation: question.explanation,
  };
}

export function buildWrongAnswerRecord(
  question: QuizQuestion,
  answer: UserAnswer,
  existingRecord?: WrongAnswerRecord,
): WrongAnswerRecord {
  return {
    questionId: question.id,
    selectedChoiceId: answer.selectedChoiceId,
    selectedChoiceIds: answer.selectedChoiceIds ?? answer.selectedPieceIds,
    selectedPieceIds: answer.selectedPieceIds,
    inputAnswer: answer.inputAnswer,
    correctAnswer: getCorrectAnswer(question),
    answeredAt: new Date().toISOString(),
    attemptCount: (existingRecord?.attemptCount ?? 0) + 1,
  };
}
