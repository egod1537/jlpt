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

function buildSentenceOrderAnswerText(question: QuizQuestion, selectedChoiceIds?: readonly string[]): string {
  if (selectedChoiceIds === undefined || selectedChoiceIds.length === 0) {
    return "";
  }

  const prefix = question.sentenceOrder?.prefix ?? "";
  const suffix = question.sentenceOrder?.suffix ?? "";
  const selectedText = selectedChoiceIds
    .map((choiceId) => question.choices.find((choice) => choice.id === choiceId)?.text ?? choiceId)
    .join(" ");

  return `${prefix}${selectedText}${suffix}`;
}

function SentenceOrderResultDetail({
  question,
  selectedChoiceIds,
}: {
  question: QuizQuestion;
  selectedChoiceIds?: readonly string[];
}) {
  const myAnswer = buildSentenceOrderAnswerText(question, selectedChoiceIds);
  const correctText = getCorrectText(question);

  return (
    <>
      {myAnswer.length > 0 && <div className="result-detail">내 답: {myAnswer}</div>}
      <div className="result-detail">
        완성 문장: <strong>{correctText}</strong>
      </div>
      {question.sentenceOrder !== undefined && <div className="result-detail">해석: {question.sentenceOrder.translationKo}</div>}
      <div className="result-detail preserve-lines">{question.explanation}</div>
    </>
  );
}

function FillBlankResultDetail({ question }: { question: QuizQuestion }) {
  const correctText = getCorrectText(question);
  const details = question.fillBlank;

  if (details === undefined) {
    return <div className="result-detail">{question.explanation}</div>;
  }

  return (
    <>
      <div className="result-detail">
        정답: <strong>{correctText}</strong>
      </div>
      {details.answerBaseExpression !== undefined && <div className="result-detail">원형 문법: {details.answerBaseExpression}</div>}
      {details.answerMeaningKo !== undefined && <div className="result-detail">의미: {details.answerMeaningKo}</div>}
      {details.answerConnection !== undefined && <div className="result-detail">접속: {details.answerConnection}</div>}
      <div className="result-detail">해석: {details.korean}</div>
      <div className="result-detail preserve-lines">{question.explanation}</div>
      {details.confusingNotes !== undefined && details.confusingNotes.length > 0 && (
        <div className="result-detail preserve-lines">{`헷갈리는 표현:\n- ${details.confusingNotes.join("\n- ")}`}</div>
      )}
    </>
  );
}

export function QuizResultBox({ question, selectedChoiceId, selectedChoiceIds }: QuizResultBoxProps) {
  const isCorrect = isCorrectAnswer(question, selectedChoiceId, selectedChoiceIds);
  const correctText = getCorrectText(question);
  const isFillBlankQuestion = question.type === "EXAMPLE_BLANK";
  const isSentenceOrderQuestion = question.type === "SENTENCE_ORDER";

  return (
    <div className={`quiz-result-box${isCorrect ? " correct" : " wrong"}`}>
      {isCorrect ? "✓ 정답!" : "✗ 오답."}
      {!isCorrect && !isFillBlankQuestion && !isSentenceOrderQuestion && (
        <>
          {" "}
          정답: <strong>{correctText}</strong>
        </>
      )}
      {question.sentenceOrder !== undefined && !isSentenceOrderQuestion && (
        <div className="result-detail">해석: {question.sentenceOrder.translationKo}</div>
      )}
      {isSentenceOrderQuestion ? (
        <SentenceOrderResultDetail question={question} selectedChoiceIds={selectedChoiceIds} />
      ) : isFillBlankQuestion ? (
        <FillBlankResultDetail question={question} />
      ) : (
        <div className="result-detail">{question.explanation}</div>
      )}
    </div>
  );
}
