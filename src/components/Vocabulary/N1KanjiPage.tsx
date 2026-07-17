import { Component } from "react";
import {
  N1_KANJI_SET_SIZE,
  type N1KanjiCard,
} from "../../data/vocabulary/n1Kanji";
import { N1WordsPage, type N1StudyLink } from "./N1WordsPage";

const STORAGE_KEY = "jlpt-n1-kanji-flashcards:v1";
const studyLinks: readonly N1StudyLink[] = [
  { active: false, href: "/n1-words", label: "단어" },
  { active: true, href: "/n1-kanji", label: "한자" },
];

type N1KanjiPageProps = {
  kanji: readonly N1KanjiCard[];
};

export class N1KanjiPage extends Component<N1KanjiPageProps> {
  render() {
    return (
      <N1WordsPage
        combinedHintLabel="뜻 / 음"
        combineHints
        getSpeechText={(card) => `${card.kr} ${card.rd}`}
        meaningHintLabel="뜻"
        primaryClassName="kanji-symbol"
        readingHintLabel="음"
        setSize={N1_KANJI_SET_SIZE}
        speechButtonTitle="뜻과 음 듣기"
        speechLang="ko-KR"
        storageKey={STORAGE_KEY}
        studyLinks={studyLinks}
        title="N1 한자"
        words={this.props.kanji}
      />
    );
  }
}
