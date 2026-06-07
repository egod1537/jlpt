import type { QuizQuestion } from "../../types/quiz";

interface QuizResultBoxProps {
  question: QuizQuestion;
  selectedChoiceId?: string;
  selectedChoiceIds?: readonly string[];
}

function isCorrectAnswer(
  question: QuizQuestion,
  selectedChoiceId?: string,
  selectedChoiceIds?: readonly string[],
): boolean {
  if (question.answerChoiceIds !== undefined) {
    return (
      selectedChoiceIds !== undefined &&
      selectedChoiceIds.length === question.answerChoiceIds.length &&
      question.answerChoiceIds.every((choiceId, index) => choiceId === selectedChoiceIds[index])
    );
  }

  return selectedChoiceId === question.answerChoiceId;
}

function getCorrectText(question: QuizQuestion): string {
  if (question.sentenceOrder !== undefined) {
    return question.sentenceOrder.fullSentence;
  }

  return question.choices.find((choice) => choice.id === question.answerChoiceId)?.text ?? question.answerChoiceId;
}

export function QuizResultBox({ question, selectedChoiceId, selectedChoiceIds }: QuizResultBoxProps) {
  const isCorrect = isCorrectAnswer(question, selectedChoiceId, selectedChoiceIds);
  const correctText = getCorrectText(question);

  return (
    <div className={`quiz-result-box${isCorrect ? " correct" : " wrong"}`}>
      {isCorrect ? "✓ 정답!" : "✗ 오답."}
      {!isCorrect && (
        <>
          {" "}
          정답: <strong>{correctText}</strong>
        </>
      )}
      {question.sentenceOrder !== undefined && (
        <div className="result-detail">해석: {question.sentenceOrder.translationKo}</div>
      )}
      <div className="result-detail">{question.explanation}</div>
    </div>
  );
}
