import { useEffect, useState } from "react";
import type { QuizQuestion, UserAnswer } from "../../types/quiz";
import { ChoiceButton } from "./ChoiceButton";
import { QuizResultBox } from "./QuizResultBox";

interface QuizCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedChoiceId?: string;
  selectedChoiceIds?: readonly string[];
  nextLabel?: string;
  onAnswer: (answer: UserAnswer) => void;
  onNext: () => void;
}

function getQuestionLabel(question: QuizQuestion): string {
  if (question.type === "GRAMMAR_MEANING") return "문법의 의미는?";
  if (question.type === "GRAMMAR_SELECT") return "어떤 문법 표현인가?";
  if (question.type === "EXAMPLE_BLANK") return "JLPT 빈칸 문제";
  if (question.type === "SENTENCE_ORDER") return "JLPT 문장 배열";
  return "이 문법과 일치하는 뉘앙스를 선택하세요";
}

function getPromptClass(question: QuizQuestion): string {
  if (question.type === "GRAMMAR_SELECT" || question.type === "EXAMPLE_BLANK" || question.type === "SENTENCE_ORDER") {
    return "quiz-question text-prompt";
  }

  return "quiz-question";
}

function SentenceOrderPrompt({ question }: { question: QuizQuestion }) {
  const orderData = question.sentenceOrder;

  if (orderData === undefined) {
    return <div className="quiz-question text-prompt">{question.prompt}</div>;
  }

  return (
    <div className="sentence-order-frame">
      <div className="sentence-order-line">
        <span>{orderData.prefix}</span>
        <span className="sentence-blank">1</span>
        <span className="sentence-blank">2</span>
        <span className="sentence-blank">3</span>
        <span className="sentence-blank">4</span>
        <span>{orderData.suffix}</span>
      </div>
      <div className="sentence-order-help">正しい順番になるように下の語句を選んでください。</div>
    </div>
  );
}

function SentenceOrderPreview({
  question,
  selectedPieceIds,
}: {
  question: QuizQuestion;
  selectedPieceIds: readonly string[];
}) {
  const sentenceWithBlanks = question.sentenceOrder?.sentenceWithBlanks ?? question.subPrompt ?? "";
  const parts = sentenceWithBlanks.split("____");

  return (
    <div className="sentence-order-line live">
      {parts.map((part, index) => {
        const selectedChoice = question.choices.find((choice) => choice.id === selectedPieceIds[index]);

        return (
          <span className="sentence-order-fragment" key={`${question.id}-fragment-${index}`}>
            {part}
            {index < parts.length - 1 &&
              (selectedChoice === undefined ? (
                <span className="sentence-blank">{index + 1}</span>
              ) : (
                <span className="sentence-filled-piece">{selectedChoice.text}</span>
              ))}
          </span>
        );
      })}
    </div>
  );
}

export function QuizCard({
  question,
  questionIndex,
  totalQuestions,
  selectedChoiceId,
  selectedChoiceIds,
  nextLabel = "다음 문제 →",
  onAnswer,
  onNext,
}: QuizCardProps) {
  const [draftOrder, setDraftOrder] = useState<string[]>([]);
  const progress = Math.round((questionIndex / totalQuestions) * 100);
  const isSentenceOrderQuestion = question.type === "SENTENCE_ORDER";
  const isAnswered = selectedChoiceId !== undefined || selectedChoiceIds !== undefined;
  const isNuanceQuestion = question.type === "NUANCE_SELECT";
  const visibleOrder = selectedChoiceIds ?? draftOrder;

  useEffect(() => {
    setDraftOrder([]);
  }, [question.id]);

  const handleSentencePieceClick = (choiceId: string) => {
    if (isAnswered || draftOrder.includes(choiceId)) {
      return;
    }

    setDraftOrder((items) => [...items, choiceId]);
  };

  const handleSentencePieceRemove = (choiceId: string) => {
    if (!isAnswered) {
      setDraftOrder((items) => items.filter((item) => item !== choiceId));
    }
  };

  const handleSentenceReset = () => {
    if (!isAnswered) {
      setDraftOrder([]);
    }
  };

  const handleSentenceCheck = () => {
    if (!isAnswered && draftOrder.length === question.choices.length) {
      onAnswer({ selectedPieceIds: draftOrder });
    }
  };

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
      {isSentenceOrderQuestion ? (
        <>
          <div className={getPromptClass(question)}>{question.prompt}</div>
          <SentenceOrderPrompt question={question} />
          <SentenceOrderPreview question={question} selectedPieceIds={visibleOrder} />
        </>
      ) : (
        <div className={getPromptClass(question)}>{question.prompt}</div>
      )}
      {question.subPrompt !== undefined && !isSentenceOrderQuestion && <div className="quiz-sub">{question.subPrompt}</div>}

      {isSentenceOrderQuestion ? (
        <>
          <div className="selected-order-row">
            {question.choices.map((choice, index) => {
              const selectedChoice = question.choices.find((item) => item.id === visibleOrder[index]);

              return (
                <button
                  className="selected-order-slot"
                  disabled={isAnswered || selectedChoice === undefined}
                  key={choice.id}
                  type="button"
                  onClick={() => selectedChoice !== undefined && handleSentencePieceRemove(selectedChoice.id)}
                >
                  <span>{index + 1}</span>
                  {selectedChoice?.text ?? ""}
                </button>
              );
            })}
          </div>
          {!isAnswered && visibleOrder.length > 0 && (
            <div className="selected-order-text">
              선택한 순서:{" "}
              {visibleOrder
                .map((choiceId) => question.choices.find((item) => item.id === choiceId)?.text ?? choiceId)
                .join(" / ")}
            </div>
          )}
          <div className="quiz-choices single-column sentence-choice-grid">
            {question.choices.map((choice, index) => {
              const selectedIndex = visibleOrder.indexOf(choice.id);
              const isSelected = selectedIndex >= 0;

              return (
                <button
                  className={`choice-btn sentence-piece${isSelected ? " selected" : ""}`}
                  disabled={isAnswered || isSelected}
                  key={choice.id}
                  type="button"
                  onClick={() => handleSentencePieceClick(choice.id)}
                >
                  <span className="choice-number">{index + 1}</span>
                  {choice.text}
                  {isSelected && <span className="selected-order-mark">{selectedIndex + 1}</span>}
                </button>
              );
            })}
          </div>
          {!isAnswered && (
            <div className="sentence-order-actions">
              <button className="sentence-undo-btn" disabled={draftOrder.length === 0} type="button" onClick={handleSentenceReset}>
                초기화
              </button>
              <button
                className="sentence-check-btn"
                disabled={draftOrder.length !== question.choices.length}
                type="button"
                onClick={handleSentenceCheck}
              >
                정답 확인
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={`quiz-choices${isNuanceQuestion ? " single-column" : ""}`}>
          {question.choices.map((choice) => (
            <ChoiceButton
              answerChoiceId={question.answerChoiceId}
              choice={choice}
              compact={isNuanceQuestion}
              key={choice.id}
              selectedChoiceId={selectedChoiceId ?? null}
              onSelect={(choiceId) => onAnswer({ selectedChoiceId: choiceId })}
            />
          ))}
        </div>
      )}

      {isAnswered && (
        <QuizResultBox question={question} selectedChoiceId={selectedChoiceId} selectedChoiceIds={selectedChoiceIds} />
      )}
      {isAnswered && (
        <button className="quiz-next-btn" type="button" onClick={onNext}>
          {nextLabel}
        </button>
      )}
    </div>
  );
}
