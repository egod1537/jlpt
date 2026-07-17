import { Component, type ChangeEvent } from "react";
import type { VocabularyItem } from "../../types/vocabulary";

const ALL_PARTS = "전체";

interface N1WordsPageProps {
  words: readonly VocabularyItem[];
}

interface N1WordsPageState {
  activePartOfSpeech: string;
  query: string;
}

export class N1WordsPage extends Component<
  N1WordsPageProps,
  N1WordsPageState
> {
  state: N1WordsPageState = {
    activePartOfSpeech: ALL_PARTS,
    query: "",
  };

  private handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ query: event.target.value });
  };

  private handlePartOfSpeechChange = (activePartOfSpeech: string): void => {
    this.setState({ activePartOfSpeech });
  };

  private getPartOfSpeechOptions(): readonly string[] {
    return [
      ALL_PARTS,
      ...Array.from(
        new Set(
          this.props.words
            .map((word) => word.partOfSpeech.trim())
            .filter((partOfSpeech) => partOfSpeech.length > 0),
        ),
      ),
    ];
  }

  private getFilteredWords(): readonly VocabularyItem[] {
    const normalizedQuery = this.state.query.trim().toLowerCase();

    return this.props.words.filter((word) => {
      const matchesPartOfSpeech =
        this.state.activePartOfSpeech === ALL_PARTS ||
        word.partOfSpeech === this.state.activePartOfSpeech;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          word.word,
          word.reading,
          word.meaningKo,
          word.partOfSpeech,
          ...word.tags,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesPartOfSpeech && matchesQuery;
    });
  }

  render() {
    const filteredWords = this.getFilteredWords();
    const partOfSpeechOptions = this.getPartOfSpeechOptions();
    const isFiltering =
      this.state.query.trim().length > 0 ||
      this.state.activePartOfSpeech !== ALL_PARTS;

    return (
      <section className="n1-words-section">
        <div className="n1-words-header">
          <div>
            <span className="n1-words-eyebrow">N1 Vocabulary</span>
            <h2>N1 단어장</h2>
          </div>
          <dl className="n1-words-stats" aria-label="N1 단어장 통계">
            <div>
              <dt>등록</dt>
              <dd>{this.props.words.length}</dd>
            </div>
            <div>
              <dt>표시</dt>
              <dd>{filteredWords.length}</dd>
            </div>
          </dl>
        </div>

        <div className="n1-words-toolbar">
          <input
            type="search"
            placeholder="단어·읽기·뜻 검색"
            value={this.state.query}
            onChange={this.handleQueryChange}
          />
          <div className="n1-words-filters" aria-label="품사 필터">
            {partOfSpeechOptions.map((partOfSpeech) => (
              <button
                className={
                  this.state.activePartOfSpeech === partOfSpeech ? "active" : ""
                }
                key={partOfSpeech}
                type="button"
                onClick={() => this.handlePartOfSpeechChange(partOfSpeech)}
              >
                {partOfSpeech}
              </button>
            ))}
          </div>
        </div>

        <div className="n1-words-result-count">
          {filteredWords.length}개 단어
        </div>

        {filteredWords.length === 0 ? (
          <div className="n1-words-empty">
            <strong>
              {isFiltering
                ? "조건에 맞는 단어가 없습니다"
                : "등록된 N1 단어가 없습니다"}
            </strong>
          </div>
        ) : (
          <div className="n1-words-table-wrap">
            <table className="n1-words-table">
              <thead>
                <tr>
                  <th>단어</th>
                  <th>읽기</th>
                  <th>뜻</th>
                  <th>품사</th>
                  <th>태그</th>
                </tr>
              </thead>
              <tbody>
                {filteredWords.map((word) => (
                  <tr key={word.id}>
                    <td>
                      <strong>{word.word}</strong>
                    </td>
                    <td>{word.reading}</td>
                    <td>{word.meaningKo}</td>
                    <td>{word.partOfSpeech}</td>
                    <td>
                      <div className="n1-word-tags">
                        {word.tags.length === 0 ? (
                          <span className="n1-word-empty-tag">-</span>
                        ) : (
                          word.tags.map((tag) => <span key={tag}>{tag}</span>)
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }
}
