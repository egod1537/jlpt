import { PureComponent } from "react";
import type { N1Word } from "../../data/vocabulary/n1Words";
import {
  formatElapsedTime,
  type N1SetSummary,
  type SwipeClass,
} from "./n1FlashcardDeck";
import type { N1StudyLink } from "./N1WordsPage";

interface N1FlashcardViewProps {
  areHintsCombined: boolean;
  combinedHintLabel: string;
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
  meaningHintLabel: string;
  primaryClassName?: string;
  progressPercent: number;
  readingHintLabel: string;
  remainingCount: number;
  setCount: number;
  setSummaries: readonly N1SetSummary[];
  speechButtonTitle: string;
  studyCount: number;
  studyLinks?: readonly N1StudyLink[];
  swipeClass: SwipeClass;
  title: string;
  totalCards: number;
  onKnown: () => void;
  onRestartAllWords: () => void;
  onRestartStudyOnly: () => void;
  onSetSelect: (setIndex: number) => void;
  onSpeakCurrentWord: () => void;
  onStartNextSet: () => void;
  onStudy: () => void;
  onToggleCombinedHints: () => void;
  onToggleKrHint: () => void;
  onToggleReadingHint: () => void;
}

export class N1FlashcardView extends PureComponent<N1FlashcardViewProps> {
  render() {
    const {
      areHintsCombined,
      combinedHintLabel,
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
      meaningHintLabel,
      primaryClassName,
      progressPercent,
      readingHintLabel,
      remainingCount,
      setCount,
      setSummaries,
      speechButtonTitle,
      studyCount,
      studyLinks,
      swipeClass,
      title,
      totalCards,
      onKnown,
      onRestartAllWords,
      onRestartStudyOnly,
      onSetSelect,
      onSpeakCurrentWord,
      onStartNextSet,
      onStudy,
      onToggleCombinedHints,
      onToggleKrHint,
      onToggleReadingHint,
    } = this.props;
    const areCombinedHintsVisible = isKrHintVisible && isReadingHintVisible;

    return (
      <section className="n1-words-section">
        <header className="flash-header">
          <div>
            <div className="header-title">{title}</div>
            <div className="flash-set-label">
              {currentSetIndex + 1} / {setCount} 세트
            </div>
            {studyLinks !== undefined && studyLinks.length > 0 && (
              <nav className="flash-study-tabs" aria-label="N1 학습 화면">
                {studyLinks.map((link) => (
                  <a
                    aria-current={link.active ? "page" : undefined}
                    className={link.active ? "active" : ""}
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
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
            title={speechButtonTitle}
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
              <div
                className={`kanjiDisplay${
                  primaryClassName === undefined ? "" : ` ${primaryClassName}`
                }`}
              >
                {currentWord?.jp}
              </div>
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
            <div className={`hint-btns${areHintsCombined ? " single" : ""}`}>
              {areHintsCombined ? (
                <button
                  className={areCombinedHintsVisible ? "active" : ""}
                  type="button"
                  onClick={onToggleCombinedHints}
                >
                  {combinedHintLabel}
                </button>
              ) : (
                <>
                  <button
                    className={isKrHintVisible ? "active" : ""}
                    type="button"
                    onClick={onToggleKrHint}
                  >
                    {meaningHintLabel}
                  </button>
                  <button
                    className={isReadingHintVisible ? "active" : ""}
                    type="button"
                    onClick={onToggleReadingHint}
                  >
                    {readingHintLabel}
                  </button>
                </>
              )}
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
