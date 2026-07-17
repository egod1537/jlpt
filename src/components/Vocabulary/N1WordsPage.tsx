import { Component } from "react";
import { N1_WORD_SET_SIZE, type N1Word } from "../../data/vocabulary/n1Words";
import {
  buildSetSummaries,
  getSetCount,
  getSetWords,
  shuffleWords,
} from "./n1FlashcardDeck";
import { N1FlashcardView } from "./N1FlashcardView";
import {
  N1_WORD_FLASHCARD_STORAGE_KEY,
  saveN1FlashcardSession,
  type N1FlashcardSession,
  type N1SetProgress,
} from "./n1FlashcardStorage";
import {
  buildRuntimeStateForSet,
  buildRuntimeStateFromDeck,
  buildSetProgress,
  buildStudyOnlyRuntimeState,
  clampSetIndex,
  createInitialN1DeckState,
  createShuffledN1DeckState,
  type N1FlashcardRuntimeState,
} from "./n1FlashcardRound";

export interface N1StudyLink {
  active: boolean;
  href: string;
  label: string;
}

type N1WordsPageProps = {
  words: readonly N1Word[];
  combinedHintLabel?: string;
  combineHints?: boolean;
  getSpeechText?: (word: N1Word) => string;
  meaningHintLabel?: string;
  primaryClassName?: string;
  readingHintLabel?: string;
  setSize?: number;
  speechButtonTitle?: string;
  speechLang?: string;
  storageKey?: string;
  studyLinks?: readonly N1StudyLink[];
  title?: string;
};

export class N1WordsPage extends Component<N1WordsPageProps, N1FlashcardRuntimeState> {
  private animationTimerId: number | undefined;
  private savedSession: N1FlashcardSession;
  private timerId: number | undefined;

  constructor(props: N1WordsPageProps) {
    super(props);

    const deckState = createInitialN1DeckState(
      props.words,
      this.getSetSize(),
      this.getStorageKey(),
    );

    this.savedSession = deckState.savedSession;
    this.state = buildRuntimeStateFromDeck(deckState);
  }

  componentDidMount(): void {
    this.syncTimer();
    this.persistCurrentProgress();
  }

  componentWillUnmount(): void {
    this.clearAnimationTimer();
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      this.setState(
        (state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }),
        () => this.persistCurrentProgress(),
      );
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== undefined) {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  private syncTimer(): void {
    if (!this.state.isComplete && this.state.roundWords.length > 0) {
      this.startTimer();
      return;
    }

    this.stopTimer();
  }

  private clearAnimationTimer(): void {
    if (this.animationTimerId !== undefined) {
      window.clearTimeout(this.animationTimerId);
      this.animationTimerId = undefined;
    }
  }

  private persistCurrentProgress(): void {
    if (this.state.isStudyOnlyRound) {
      if (this.state.isComplete) {
        this.persistCompletedStudyOnlyRound();
      }

      return;
    }

    this.savedSession = {
      currentSetIndex: this.state.currentSetIndex,
      setProgress: {
        ...this.savedSession.setProgress,
        [String(this.state.currentSetIndex)]: buildSetProgress(this.state),
      },
      shuffledWordIds: this.state.shuffledWords.map((word) => word.n),
    };
    saveN1FlashcardSession(this.savedSession, this.getStorageKey());
  }

  private persistCompletedStudyOnlyRound(): void {
    const setKey = String(this.state.currentSetIndex);

    this.savedSession = {
      currentSetIndex: this.state.currentSetIndex,
      setProgress: {
        ...this.savedSession.setProgress,
        [setKey]: this.buildCompletedStudyOnlyProgress(),
      },
      shuffledWordIds: this.state.shuffledWords.map((word) => word.n),
    };
    saveN1FlashcardSession(this.savedSession, this.getStorageKey());
  }

  private selectSet = (setIndex: number): void => {
    const nextSetIndex = clampSetIndex(
      setIndex,
      getSetCount(this.state.shuffledWords, this.getSetSize()),
    );

    this.clearAnimationTimer();
    this.setState(
      buildRuntimeStateForSet(
        nextSetIndex,
        this.state.shuffledWords,
        this.getSetSize(),
        this.savedSession,
      ),
      () => {
        this.syncTimer();
        this.persistCurrentProgress();
      },
    );
  };

  private restartAllWords = (): void => {
    const deckState = createShuffledN1DeckState(
      this.props.words,
      this.getSetSize(),
    );

    this.savedSession = deckState.savedSession;
    saveN1FlashcardSession(this.savedSession, this.getStorageKey());
    this.clearAnimationTimer();
    this.setState(
      buildRuntimeStateFromDeck(deckState),
      () => {
        this.syncTimer();
        this.persistCurrentProgress();
      },
    );
  };

  private restartStudyOnly = (): void => {
    if (this.state.studyList.length === 0) {
      return;
    }

    const roundWords = shuffleWords(this.state.studyList);

    this.clearAnimationTimer();
    this.setState(
      buildStudyOnlyRuntimeState(roundWords),
      () => this.syncTimer(),
    );
  };

  private restartCurrentSet = (): void => {
    const setSize = this.getSetSize();
    const setIndex = this.state.currentSetIndex;
    const setStartIndex = setIndex * setSize;
    const setWords = getSetWords(this.state.shuffledWords, setIndex, setSize);
    const shuffledSetWords = shuffleWords(setWords);
    const shuffledWords = [
      ...this.state.shuffledWords.slice(0, setStartIndex),
      ...shuffledSetWords,
      ...this.state.shuffledWords.slice(setStartIndex + setWords.length),
    ];
    const setKey = String(setIndex);
    const completedRoundCount =
      this.savedSession.setProgress[setKey]?.completedRoundCount ??
      this.state.completedRoundCount;

    this.savedSession = {
      currentSetIndex: setIndex,
      setProgress: {
        ...this.savedSession.setProgress,
        [setKey]: {
          completedRoundCount,
          elapsedSeconds: 0,
          knowWordIds: [],
          studyWordIds: [],
          wordIndex: 0,
        },
      },
      shuffledWordIds: shuffledWords.map((word) => word.n),
    };

    saveN1FlashcardSession(this.savedSession, this.getStorageKey());
    this.clearAnimationTimer();
    this.setState(
      buildRuntimeStateForSet(
        setIndex,
        shuffledWords,
        setSize,
        this.savedSession,
      ),
      () => {
        this.syncTimer();
        this.persistCurrentProgress();
      },
    );
  };

  private startNextSet = (): void => {
    this.selectSet(this.state.currentSetIndex + 1);
  };

  private hideHints(afterHide?: () => void): void {
    this.setState(
      {
        isKrHintVisible: false,
        isReadingHintVisible: false,
      },
      afterHide,
    );
  }

  private toggleKrHint = (): void => {
    this.setState((state) => ({
      isKrHintVisible: !state.isKrHintVisible,
    }));
  };

  private toggleReadingHint = (): void => {
    this.setState((state) => ({
      isReadingHintVisible: !state.isReadingHintVisible,
    }));
  };

  private toggleCombinedHints = (): void => {
    this.setState((state) => {
      const shouldShowHints =
        !state.isKrHintVisible || !state.isReadingHintVisible;

      return {
        isKrHintVisible: shouldShowHints,
        isReadingHintVisible: shouldShowHints,
      };
    });
  };

  private handleStudy = (): void => {
    this.next("study");
  };

  private handleKnown = (): void => {
    this.next("known");
  };

  private next(action: "study" | "known"): void {
    const currentWord = this.getCurrentWord();

    if (
      currentWord === undefined ||
      this.state.isComplete ||
      this.state.swipeClass !== ""
    ) {
      return;
    }

    this.hideHints(() => {
      this.setState(
        (state) => ({
          knowList:
            action === "known" ? [...state.knowList, currentWord] : state.knowList,
          studyList:
            action === "study"
              ? [...state.studyList, currentWord]
              : state.studyList,
          swipeClass: action === "study" ? "swipe-left" : "swipe-right",
        }),
        () => {
          this.animationTimerId = window.setTimeout(() => {
            this.setState(
              (state) => {
                const nextIndex = state.wordIndex + 1;
                const isComplete = nextIndex >= state.roundWords.length;
                const completedRoundCount =
                  isComplete && state.studyList.length === 0
                    ? state.completedRoundCount + 1
                    : state.completedRoundCount;

                return {
                  completedRoundCount,
                  isComplete,
                  swipeClass: "",
                  wordIndex: nextIndex,
                };
              },
              () => {
                this.syncTimer();
                this.persistCurrentProgress();
              },
            );
          }, 220);
        },
      );
    });
  }

  private speakCurrentWord = (): void => {
    const currentWord = this.getCurrentWord();

    if (currentWord === undefined || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      this.props.getSpeechText?.(currentWord) ?? currentWord.jp,
    );
    utterance.lang = this.props.speechLang ?? "ja-JP";
    window.speechSynthesis.speak(utterance);
  };

  private getCurrentWord(): N1Word | undefined {
    return this.state.roundWords[this.state.wordIndex];
  }

  private getSetProgressForRender() {
    if (this.state.isStudyOnlyRound && this.state.isComplete) {
      return {
        ...this.savedSession.setProgress,
        [String(this.state.currentSetIndex)]:
          this.buildCompletedStudyOnlyProgress(),
      };
    }

    if (this.state.isStudyOnlyRound) {
      return this.savedSession.setProgress;
    }

    return {
      ...this.savedSession.setProgress,
      [String(this.state.currentSetIndex)]: buildSetProgress(this.state),
    };
  }

  private buildCompletedStudyOnlyProgress(): N1SetProgress {
    const previousProgress =
      this.savedSession.setProgress[String(this.state.currentSetIndex)];

    return {
      completedRoundCount: this.state.completedRoundCount,
      elapsedSeconds:
        (previousProgress?.elapsedSeconds ?? 0) + this.state.elapsedSeconds,
      knowWordIds: mergeWordIds([
        ...(previousProgress?.knowWordIds ?? []),
        ...this.state.knowList.map((word) => word.n),
      ]),
      studyWordIds: this.state.studyList.map((word) => word.n),
      wordIndex: this.getCurrentSetTotalCount(),
    };
  }

  private getCurrentSetTotalCount(): number {
    return getSetWords(
      this.state.shuffledWords,
      this.state.currentSetIndex,
      this.getSetSize(),
    ).length;
  }

  private getSetSize(): number {
    return this.props.setSize ?? N1_WORD_SET_SIZE;
  }

  private getStorageKey(): string {
    return this.props.storageKey ?? N1_WORD_FLASHCARD_STORAGE_KEY;
  }

  render() {
    const setCount = getSetCount(this.state.shuffledWords, this.getSetSize());
    const currentWord = this.getCurrentWord();
    const totalCards = this.state.roundWords.length;
    const doneCount = Math.min(this.state.wordIndex, totalCards);
    const remainingCount = Math.max(totalCards - this.state.wordIndex, 0);
    const currentNumber = this.state.isComplete
      ? totalCards
      : Math.min(this.state.wordIndex + 1, totalCards);
    const progressPercent =
      totalCards === 0 ? 0 : Math.round((doneCount / totalCards) * 100);

    return (
      <N1FlashcardView
        areHintsCombined={this.props.combineHints === true}
        combinedHintLabel={this.props.combinedHintLabel ?? "뜻 / 음"}
        currentNumber={currentNumber}
        currentSetIndex={this.state.currentSetIndex}
        currentWord={currentWord}
        completedRoundCount={this.state.completedRoundCount}
        doneCount={doneCount}
        elapsedSeconds={this.state.elapsedSeconds}
        hasNextSet={this.state.currentSetIndex < setCount - 1}
        isComplete={this.state.isComplete}
        isKrHintVisible={this.state.isKrHintVisible}
        isReadingHintVisible={this.state.isReadingHintVisible}
        knowCount={this.state.knowList.length}
        meaningHintLabel={this.props.meaningHintLabel ?? "한국어"}
        primaryClassName={this.props.primaryClassName}
        progressPercent={progressPercent}
        readingHintLabel={this.props.readingHintLabel ?? "ひらがな"}
        remainingCount={remainingCount}
        setCount={setCount}
        setSummaries={buildSetSummaries(
          this.state.shuffledWords,
          this.getSetSize(),
          this.getSetProgressForRender(),
        )}
        speechButtonTitle={this.props.speechButtonTitle ?? "일본어 발음"}
        studyCount={this.state.studyList.length}
        studyLinks={this.props.studyLinks}
        swipeClass={this.state.swipeClass}
        title={this.props.title ?? "N1 단어장"}
        totalCards={totalCards}
        onKnown={this.handleKnown}
        onRestartAllWords={this.restartAllWords}
        onRestartCurrentSet={this.restartCurrentSet}
        onRestartStudyOnly={this.restartStudyOnly}
        onSetSelect={this.selectSet}
        onSpeakCurrentWord={this.speakCurrentWord}
        onStartNextSet={this.startNextSet}
        onStudy={this.handleStudy}
        onToggleCombinedHints={this.toggleCombinedHints}
        onToggleKrHint={this.toggleKrHint}
        onToggleReadingHint={this.toggleReadingHint}
      />
    );
  }
}

function mergeWordIds(wordIds: readonly number[]): number[] {
  const seenWordIds = new Set<number>();

  return wordIds.filter((wordId) => {
    if (seenWordIds.has(wordId)) {
      return false;
    }

    seenWordIds.add(wordId);
    return true;
  });
}
