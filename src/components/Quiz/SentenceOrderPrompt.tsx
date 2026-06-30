import { PureComponent } from "react";
import type { QuizQuestion } from "../../types/quiz";

interface SentenceOrderPromptProps {
  question: QuizQuestion;
}

export class SentenceOrderPrompt extends PureComponent<SentenceOrderPromptProps> {
  render() {
    const { question } = this.props;
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
        <div className="sentence-order-help">
          正しい順番になるように下の語句を選んでください。
        </div>
      </div>
    );
  }
}

interface SentenceOrderPreviewProps {
  question: QuizQuestion;
  selectedPieceIds: readonly string[];
}

export class SentenceOrderPreview extends PureComponent<SentenceOrderPreviewProps> {
  render() {
    const { question, selectedPieceIds } = this.props;
    const sentenceWithBlanks =
      question.sentenceOrder?.sentenceWithBlanks ?? question.subPrompt ?? "";
    const parts = sentenceWithBlanks.split("____");

    return (
      <div className="sentence-order-line live">
        {parts.map((part, index) => {
          const selectedChoice = question.choices.find(
            (choice) => choice.id === selectedPieceIds[index],
          );

          return (
            <span
              className="sentence-order-fragment"
              key={`${question.id}-fragment-${index}`}
            >
              {part}
              {index < parts.length - 1 &&
                (selectedChoice === undefined ? (
                  <span className="sentence-blank">{index + 1}</span>
                ) : (
                  <span className="sentence-filled-piece">
                    {selectedChoice.text}
                  </span>
                ))}
            </span>
          );
        })}
      </div>
    );
  }
}
