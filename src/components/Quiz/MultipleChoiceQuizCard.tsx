import { PureComponent } from "react";
import type { QuizQuestion, UserAnswer } from "../../types/quiz";
import { ChoiceButton } from "./ChoiceButton";
import { QuizProgress } from "./QuizProgress";
import { QuizResultBox } from "./QuizResultBox";
import { getPromptClass, getQuestionLabel } from "./quizPresentation";

interface MultipleChoiceQuizCardProps {
  nextLabel: string;
  question: QuizQuestion;
  questionIndex: number;
  selectedChoiceId?: string;
  totalQuestions: number;
  onAnswer: (answer: UserAnswer) => void;
  onNext: () => void;
}

export class MultipleChoiceQuizCard extends PureComponent<MultipleChoiceQuizCardProps> {
  render() {
    const {
      nextLabel,
      question,
      questionIndex,
      selectedChoiceId,
      totalQuestions,
      onAnswer,
      onNext,
    } = this.props;
    const isAnswered = selectedChoiceId !== undefined;

    return (
      <div className="quiz-card">
        <QuizProgress
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
        />
        <div className="quiz-q-label">{getQuestionLabel(question)}</div>
        <div className={getPromptClass(question)}>{question.prompt}</div>
        {question.subPrompt !== undefined && (
          <div className="quiz-sub">{question.subPrompt}</div>
        )}
        <div className="quiz-choices">
          {question.choices.map((choice) => (
            <ChoiceButton
              answerChoiceId={question.answerChoiceId}
              choice={choice}
              key={choice.id}
              selectedChoiceId={selectedChoiceId ?? null}
              onSelect={(choiceId) => onAnswer({ selectedChoiceId: choiceId })}
            />
          ))}
        </div>
        {isAnswered && (
          <QuizResultBox
            question={question}
            selectedChoiceId={selectedChoiceId}
          />
        )}
        {isAnswered && (
          <button className="quiz-next-btn" type="button" onClick={onNext}>
            {nextLabel}
          </button>
        )}
      </div>
    );
  }
}
