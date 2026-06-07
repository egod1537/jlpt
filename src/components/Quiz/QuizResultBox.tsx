import type { QuizQuestion } from "../../types/quiz";

interface QuizResultBoxProps {
  question: QuizQuestion;
  selectedChoiceId: string;
}

export function QuizResultBox({ question, selectedChoiceId }: QuizResultBoxProps) {
  const isCorrect = selectedChoiceId === question.answerChoiceId;
  const correctChoice = question.choices.find((choice) => choice.id === question.answerChoiceId);

  return (
    <div className={`quiz-result-box${isCorrect ? " correct" : " wrong"}`}>
      {isCorrect ? "✓ 정답!" : "✗ 오답."}
      {!isCorrect && correctChoice !== undefined && (
        <>
          {" "}
          정답: <strong>{correctChoice.text}</strong>
        </>
      )}
      <div className="result-detail">{question.explanation}</div>
    </div>
  );
}
