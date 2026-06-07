import type { QuizQuestion } from "../../types/quiz";
import { ChoiceButton } from "./ChoiceButton";
import { QuizResultBox } from "./QuizResultBox";

interface QuizCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedChoiceId: string | null;
  nextLabel?: string;
  onSelect: (choiceId: string) => void;
  onNext: () => void;
}

function getQuestionLabel(question: QuizQuestion): string {
  if (question.type === "GRAMMAR_MEANING") return "문법의 의미는?";
  if (question.type === "GRAMMAR_SELECT") return "어떤 문법 표현인가?";
  if (question.type === "EXAMPLE_BLANK") return "어떤 문법이 사용되었나?";
  return "이 문법과 일치하는 뉘앙스를 선택하세요";
}

function getPromptClass(question: QuizQuestion): string {
  if (question.type === "GRAMMAR_SELECT" || question.type === "EXAMPLE_BLANK") {
    return "quiz-question text-prompt";
  }

  return "quiz-question";
}

export function QuizCard({
  question,
  questionIndex,
  totalQuestions,
  selectedChoiceId,
  nextLabel = "다음 문제 →",
  onSelect,
  onNext,
}: QuizCardProps) {
  const progress = Math.round((questionIndex / totalQuestions) * 100);
  const isAnswered = selectedChoiceId !== null;
  const isNuanceQuestion = question.type === "NUANCE_SELECT";

  return (
    <div className="quiz-card">
      <div className="quiz-progress">
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          {questionIndex + 1} / {totalQuestions}
        </div>
      </div>

      <div className="quiz-q-label">{getQuestionLabel(question)}</div>
      <div className={getPromptClass(question)}>{question.prompt}</div>
      {question.subPrompt !== undefined && <div className="quiz-sub">{question.subPrompt}</div>}

      <div className={`quiz-choices${isNuanceQuestion ? " single-column" : ""}`}>
        {question.choices.map((choice) => (
          <ChoiceButton
            answerChoiceId={question.answerChoiceId}
            choice={choice}
            compact={isNuanceQuestion}
            key={choice.id}
            selectedChoiceId={selectedChoiceId}
            onSelect={onSelect}
          />
        ))}
      </div>

      {selectedChoiceId !== null && <QuizResultBox question={question} selectedChoiceId={selectedChoiceId} />}
      {isAnswered && (
        <button className="quiz-next-btn" type="button" onClick={onNext}>
          {nextLabel}
        </button>
      )}
    </div>
  );
}
