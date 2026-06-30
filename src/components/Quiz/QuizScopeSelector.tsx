import { PureComponent } from "react";
import type { QuizScope } from "./quizConfig";

interface QuizScopeSelectorProps {
  favoriteCount: number;
  scope: QuizScope;
  onScopeChange: (scope: QuizScope) => void;
}

export class QuizScopeSelector extends PureComponent<QuizScopeSelectorProps> {
  private selectAll = (): void => {
    this.props.onScopeChange("all");
  };

  private selectFavorites = (): void => {
    this.props.onScopeChange("favorites");
  };

  render() {
    const { favoriteCount, scope } = this.props;

    return (
      <div className="quiz-scope-selector" aria-label="테스트 출제 범위">
        <span className="scope-selector-label">출제 범위</span>
        <button
          className={`scope-btn${scope === "all" ? " active" : ""}`}
          type="button"
          onClick={this.selectAll}
        >
          전체
        </button>
        <button
          className={`scope-btn${scope === "favorites" ? " active" : ""}`}
          type="button"
          onClick={this.selectFavorites}
        >
          ★ 즐겨찾기
          <span>{favoriteCount}</span>
        </button>
      </div>
    );
  }
}
