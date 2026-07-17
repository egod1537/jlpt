import { PureComponent } from "react";
import type { N1Word } from "../../data/vocabulary/n1Words";
import {
  formatElapsedTime,
  type N1SetSummary,
  type SwipeClass,
} from "./n1FlashcardDeck";

interface N1FlashcardViewProps {
  currentNumber: number;
  currentSetIndex: number;
  currentWord: N1Word | undefined;
  doneCount: number;
  elapsedSeconds: number;
  hasNextSet: boolean;
  isComplete: boolean;
  isKrHintVisible: boolean;
  isReadingHintVisible: boolean;
  knowCount: number;
  progressPercent: number;
  remainingCount: number;
  setCount: number;
  setSummaries: readonly N1SetSummary[];
  studyCount: number;
  swipeClass: SwipeClass;
  totalCards: number;
  onKnown: () => void;
  onRestartAllWords: () => void;
  onRestartStudyOnly: () => void;
  onSetSelect: (setIndex: number) => void;
  onSpeakCurrentWord: () => void;
  onStartNextSet: () => void;
  onStudy: () => void;
  onToggleKrHint: () => void;
  onToggleReadingHint: () => void;
}

export class N1FlashcardView extends PureComponent<N1FlashcardViewProps> {
  render() {
    const {
      currentNumber,
      currentSetIndex,
      currentWord,
      doneCount,
      elapsedSeconds,
      hasNextSet,
      isComplete,
      isKrHintVisible,
      isReadingHintVisible,
      knowCount,
      progressPercent,
      remainingCount,
      setCount,
      setSummaries,
      studyCount,
      swipeClass,
      totalCards,
      onKnown,
      onRestartAllWords,
      onRestartStudyOnly,
      onSetSelect,
      onSpeakCurrentWord,
      onStartNextSet,
      onStudy,
      onToggleKrHint,
      onToggleReadingHint,
    } = this.props;

    return (
      <section className="n1-words-section">
        <header className="flash-header">
          <div>
            <div className="header-title">N1 단어장</div>
            <div className="flash-set-label">
              {currentSetIndex + 1} / {setCount} 세트
            </div>
          </div>
          <div className="flash-counter">
            {currentNumber} / {totalCards}
          </div>
        </header>

        <div className="timer-bar" aria-label="경과 시간">
          <span>{formatElapsedTime(elapsedSeconds)}</span>
        </div>

        <div className="flash-set-selector" aria-label="세트 선택">
          {setSummaries.map((setSummary) => (
            <button
              aria-current={
                currentSetIndex === setSummary.index ? "page" : undefined
              }
              className={`flash-set-btn${
                currentSetIndex === setSummary.index ? " active" : ""
              }${setSummary.isComplete ? " complete" : ""}`}
              key={setSummary.index}
              type="button"
              onClick={() => onSetSelect(setSummary.index)}
            >
              <span>{setSummary.index + 1}</span>
              <small>
                {setSummary.doneCount}/{setSummary.totalCount}
              </small>
            </button>
          ))}
        </div>

        <div className="flash-options" aria-label="플래시카드 옵션">
          <button type="button" title="현재 세트">
            ★
          </button>
          <button type="button" title="전체 셔플" onClick={onRestartAllWords}>
            ∞
          </button>
          <button type="button" title="남은 카드 수">
            {remainingCount}
          </button>
          <button
            type="button"
            title="일본어 발음"
            onClick={onSpeakCurrentWord}
          >
            🔊
          </button>
        </div>

        <main className="flash-main">
          {isComplete ? (
            <div className="complete-screen">
              <span>Round Complete</span>
              <strong>{totalCards}개 완료</strong>
              <p>
                알고있음 {knowCount}개 · 공부하겠음 {studyCount}개
              </p>
              <div className="complete-actions">
                <button type="button" onClick={onRestartAllWords}>
                  처음부터 다시
                </button>
                <button
                  disabled={studyCount === 0}
                  type="button"
                  onClick={onRestartStudyOnly}
                >
                  모르는 것만 다시
                </button>
                {hasNextSet && (
                  <button type="button" onClick={onStartNextSet}>
                    다음 세트
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={`flash-card ${swipeClass}`}>
              {currentWord?.needsReview && (
                <div className="review-badge">검수 필요</div>
              )}
              <div className="kanjiDisplay">{currentWord?.jp}</div>
              <div className="hint-panel">
                <div
                  className={`hint-text${isKrHintVisible ? " visible" : ""}`}
                  id="hintKr"
                >
                  {currentWord?.kr}
                </div>
                <div
                  className={`hint-text${
                    isReadingHintVisible ? " visible" : ""
                  }`}
                  id="hintRd"
                >
                  {currentWord?.rd}
                </div>
              </div>
            </div>
          )}
        </main>

        <div className="flash-progress" aria-label="진행률">
          <div className="progress-copy">
            <span>완료 {doneCount}</span>
            <span>남은 카드 {remainingCount}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {!isComplete && (
          <footer className="flash-bottom">
            <div className="hint-btns">
              <button
                className={isKrHintVisible ? "active" : ""}
                type="button"
                onClick={onToggleKrHint}
              >
                한국어
              </button>
              <button
                className={isReadingHintVisible ? "active" : ""}
                type="button"
                onClick={onToggleReadingHint}
              >
                ひらがな
              </button>
            </div>
            <div className="action-btns">
              <button className="study-action" type="button" onClick={onStudy}>
                <span>★</span>
                공부하겠음
              </button>
              <button className="known-action" type="button" onClick={onKnown}>
                알고있음
              </button>
            </div>
          </footer>
        )}
      </section>
    );
  }
}
