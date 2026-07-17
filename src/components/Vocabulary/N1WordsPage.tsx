import { Component } from "react";
import { N1_WORD_SET_SIZE, type N1Word } from "../../data/vocabulary/n1Words";
import { buildSetSummaries, getSetCount, shuffleWords } from "./n1FlashcardDeck";
import { N1FlashcardView } from "./N1FlashcardView";
import { saveN1FlashcardSession, type N1FlashcardSession } from "./n1FlashcardStorage";
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

type N1WordsPageProps = { words: readonly N1Word[] };

export class N1WordsPage extends Component<N1WordsPageProps, N1FlashcardRuntimeState> {
  private animationTimerId: number | undefined;
  private savedSession: N1FlashcardSession;
  private timerId: number | undefined;

  constructor(props: N1WordsPageProps) {
    super(props);

    const deckState = createInitialN1DeckState(props.words, N1_WORD_SET_SIZE);

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
    saveN1FlashcardSession(this.savedSession);
  }

  private selectSet = (setIndex: number): void => {
    const nextSetIndex = clampSetIndex(
      setIndex,
      getSetCount(this.state.shuffledWords, N1_WORD_SET_SIZE),
    );

    this.clearAnimationTimer();
    this.setState(
      buildRuntimeStateForSet(
        nextSetIndex,
        this.state.shuffledWords,
        N1_WORD_SET_SIZE,
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
      N1_WORD_SET_SIZE,
    );

    this.savedSession = deckState.savedSession;
    saveN1FlashcardSession(this.savedSession);
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

                return {
                  isComplete: nextIndex >= state.roundWords.length,
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
    const utterance = new SpeechSynthesisUtterance(currentWord.jp);
    utterance.lang = "ja-JP";
    window.speechSynthesis.speak(utterance);
  };

  private getCurrentWord(): N1Word | undefined {
    return this.state.roundWords[this.state.wordIndex];
  }

  private getSetProgressForRender() {
    if (this.state.isStudyOnlyRound) {
      return this.savedSession.setProgress;
    }

    return {
      ...this.savedSession.setProgress,
      [String(this.state.currentSetIndex)]: buildSetProgress(this.state),
    };
  }

  render() {
    const setCount = getSetCount(this.state.shuffledWords, N1_WORD_SET_SIZE);
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
        currentNumber={currentNumber}
        currentSetIndex={this.state.currentSetIndex}
        currentWord={currentWord}
        doneCount={doneCount}
        elapsedSeconds={this.state.elapsedSeconds}
        hasNextSet={this.state.currentSetIndex < setCount - 1}
        isComplete={this.state.isComplete}
        isKrHintVisible={this.state.isKrHintVisible}
        isReadingHintVisible={this.state.isReadingHintVisible}
        knowCount={this.state.knowList.length}
        progressPercent={progressPercent}
        remainingCount={remainingCount}
        setCount={setCount}
        setSummaries={buildSetSummaries(
          this.state.shuffledWords,
          N1_WORD_SET_SIZE,
          this.getSetProgressForRender(),
        )}
        studyCount={this.state.studyList.length}
        swipeClass={this.state.swipeClass}
        totalCards={totalCards}
        onKnown={this.handleKnown}
        onRestartAllWords={this.restartAllWords}
        onRestartStudyOnly={this.restartStudyOnly}
        onSetSelect={this.selectSet}
        onSpeakCurrentWord={this.speakCurrentWord}
        onStartNextSet={this.startNextSet}
        onStudy={this.handleStudy}
        onToggleKrHint={this.toggleKrHint}
        onToggleReadingHint={this.toggleReadingHint}
      />
    );
  }
}
