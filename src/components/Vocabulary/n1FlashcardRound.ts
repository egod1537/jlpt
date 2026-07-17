import type { N1Word } from "../../data/vocabulary/n1Words";
import {
  getSetCount,
  getSetWords,
  shuffleWords,
  type SwipeClass,
} from "./n1FlashcardDeck";
import {
  buildWordById,
  createN1FlashcardSession,
  loadN1FlashcardSession,
  mapWordIdsToWords,
  restoreShuffledWords,
  type N1FlashcardSession,
  type N1SetProgress,
} from "./n1FlashcardStorage";

export interface N1RoundState {
  elapsedSeconds: number;
  isComplete: boolean;
  knowList: readonly N1Word[];
  roundWords: readonly N1Word[];
  studyList: readonly N1Word[];
  wordIndex: number;
}

export interface N1DeckState {
  currentSetIndex: number;
  roundState: N1RoundState;
  savedSession: N1FlashcardSession;
  shuffledWords: readonly N1Word[];
}

export interface N1FlashcardRuntimeState extends N1RoundState {
  currentSetIndex: number;
  isKrHintVisible: boolean;
  isReadingHintVisible: boolean;
  isStudyOnlyRound: boolean;
  shuffledWords: readonly N1Word[];
  swipeClass: SwipeClass;
}

export function createInitialN1DeckState(
  words: readonly N1Word[],
  setSize: number,
  storageKey?: string,
): N1DeckState {
  const loadedSession = loadN1FlashcardSession(storageKey);
  const restoredWords =
    loadedSession === null
      ? null
      : restoreShuffledWords(words, loadedSession.shuffledWordIds);
  const shuffledWords = restoredWords ?? shuffleWords(words);
  const setCount = getSetCount(shuffledWords, setSize);
  const currentSetIndex = clampSetIndex(
    restoredWords === null ? 0 : loadedSession?.currentSetIndex ?? 0,
    setCount,
  );
  const savedSession = createN1FlashcardSession(
    currentSetIndex,
    shuffledWords,
    restoredWords === null ? {} : loadedSession?.setProgress,
  );

  return {
    currentSetIndex,
    roundState: buildSetRoundState(
      currentSetIndex,
      shuffledWords,
      setSize,
      savedSession,
    ),
    savedSession,
    shuffledWords,
  };
}

export function createShuffledN1DeckState(
  words: readonly N1Word[],
  setSize: number,
): N1DeckState {
  const shuffledWords = shuffleWords(words);
  const currentSetIndex = 0;
  const savedSession = createN1FlashcardSession(currentSetIndex, shuffledWords);

  return {
    currentSetIndex,
    roundState: buildSetRoundState(
      currentSetIndex,
      shuffledWords,
      setSize,
      savedSession,
    ),
    savedSession,
    shuffledWords,
  };
}

export function buildSetRoundState(
  setIndex: number,
  shuffledWords: readonly N1Word[],
  setSize: number,
  savedSession: N1FlashcardSession,
): N1RoundState {
  const roundWords = getSetWords(shuffledWords, setIndex, setSize);
  const progress = savedSession.setProgress[String(setIndex)];
  const wordById = buildWordById(shuffledWords);
  const wordIndex = Math.min(progress?.wordIndex ?? 0, roundWords.length);

  return {
    elapsedSeconds: progress?.elapsedSeconds ?? 0,
    isComplete: roundWords.length === 0 || wordIndex >= roundWords.length,
    knowList: mapWordIdsToWords(progress?.knowWordIds ?? [], wordById),
    roundWords,
    studyList: mapWordIdsToWords(progress?.studyWordIds ?? [], wordById),
    wordIndex,
  };
}

export function buildRuntimeStateFromDeck(
  deckState: N1DeckState,
): N1FlashcardRuntimeState {
  return {
    ...deckState.roundState,
    currentSetIndex: deckState.currentSetIndex,
    isKrHintVisible: false,
    isReadingHintVisible: false,
    isStudyOnlyRound: false,
    shuffledWords: deckState.shuffledWords,
    swipeClass: "",
  };
}

export function buildRuntimeStateForSet(
  setIndex: number,
  shuffledWords: readonly N1Word[],
  setSize: number,
  savedSession: N1FlashcardSession,
): N1FlashcardRuntimeState {
  return {
    ...buildSetRoundState(setIndex, shuffledWords, setSize, savedSession),
    currentSetIndex: setIndex,
    isKrHintVisible: false,
    isReadingHintVisible: false,
    isStudyOnlyRound: false,
    shuffledWords,
    swipeClass: "",
  };
}

export function buildStudyOnlyRuntimeState(
  roundWords: readonly N1Word[],
): Pick<
  N1FlashcardRuntimeState,
  | "elapsedSeconds"
  | "isComplete"
  | "isKrHintVisible"
  | "isReadingHintVisible"
  | "isStudyOnlyRound"
  | "knowList"
  | "roundWords"
  | "studyList"
  | "swipeClass"
  | "wordIndex"
> {
  return {
    elapsedSeconds: 0,
    isComplete: roundWords.length === 0,
    isKrHintVisible: false,
    isReadingHintVisible: false,
    isStudyOnlyRound: true,
    knowList: [],
    roundWords,
    studyList: [],
    swipeClass: "",
    wordIndex: 0,
  };
}

export function buildSetProgress(state: N1FlashcardRuntimeState): N1SetProgress {
  return {
    elapsedSeconds: state.elapsedSeconds,
    knowWordIds: state.knowList.map((word) => word.n),
    studyWordIds: state.studyList.map((word) => word.n),
    wordIndex: Math.min(state.wordIndex, state.roundWords.length),
  };
}

export function clampSetIndex(setIndex: number, setCount: number): number {
  return Math.min(Math.max(setIndex, 0), Math.max(setCount - 1, 0));
}
