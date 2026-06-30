import { Component } from "react";
import type { GrammarItem } from "../../types/grammar";
import type { QuizMode } from "../../types/quiz";
import { QuizSessionPanel } from "./QuizSessionPanel";
import type { QuizScope } from "./quizConfig";

interface QuizPageProps {
  favoriteIds: readonly string[];
  grammarItems: readonly GrammarItem[];
}

interface QuizPageState {
  mode: QuizMode;
  scope: QuizScope;
}

export class QuizPage extends Component<QuizPageProps, QuizPageState> {
  state: QuizPageState = {
    mode: "meaning",
    scope: "all",
  };

  private handleModeChange = (mode: QuizMode): void => {
    this.setState({ mode });
  };

  private handleScopeChange = (scope: QuizScope): void => {
    this.setState({ scope });
  };

  render() {
    const { favoriteIds, grammarItems } = this.props;
    const { mode, scope } = this.state;
    const sessionKey = `${mode}:${scope}:${
      scope === "favorites" ? favoriteIds.join(",") : "all"
    }`;

    return (
      <section className="quiz-section">
        <QuizSessionPanel
          favoriteIds={favoriteIds}
          grammarItems={grammarItems}
          key={sessionKey}
          mode={mode}
          scope={scope}
          onModeChange={this.handleModeChange}
          onScopeChange={this.handleScopeChange}
        />
      </section>
    );
  }
}
