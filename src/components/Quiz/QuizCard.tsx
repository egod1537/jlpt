import { PureComponent } from "react";
import type { QuizQuestion, UserAnswer } from "../../types/quiz";
import { MultipleChoiceQuizCard } from "./MultipleChoiceQuizCard";
import { SentenceOrderQuizCard } from "./SentenceOrderQuizCard";

interface QuizCardProps {
  nextLabel?: string;
  question: QuizQuestion;
  questionIndex: number;
  selectedChoiceId?: string;
  selectedChoiceIds?: readonly string[];
  totalQuestions: number;
  onAnswer: (answer: UserAnswer) => void;
  onNext: () => void;
}

export class QuizCard extends PureComponent<QuizCardProps> {
  render() {
    const {
      nextLabel = "다음 문제 →",
      question,
      questionIndex,
      selectedChoiceId,
      selectedChoiceIds,
      totalQuestions,
      onAnswer,
      onNext,
    } = this.props;

    if (question.type === "SENTENCE_ORDER") {
      return (
        <SentenceOrderQuizCard
          nextLabel={nextLabel}
          question={question}
          questionIndex={questionIndex}
          selectedChoiceIds={selectedChoiceIds}
          totalQuestions={totalQuestions}
          onAnswer={onAnswer}
          onNext={onNext}
        />
      );
    }

    return (
      <MultipleChoiceQuizCard
        nextLabel={nextLabel}
        question={question}
        questionIndex={questionIndex}
        selectedChoiceId={selectedChoiceId}
        totalQuestions={totalQuestions}
        onAnswer={onAnswer}
        onNext={onNext}
      />
    );
  }
}
