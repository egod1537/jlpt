import { Component, type ChangeEvent } from "react";
import {
  honorificEntries,
  honorificPatterns,
  honorificQuizQuestions,
} from "../../data/honorific";
import type { HonorificCategory } from "../../types/honorific";
import { HonorificEntryTable } from "./HonorificEntryTable";
import { HonorificPatterns } from "./HonorificPatterns";
import { HonorificQuiz } from "./HonorificQuiz";

type HonorificView = "reference" | "quiz";
type CategoryFilter = "전체" | HonorificCategory;

const categories: CategoryFilter[] = [
  "전체",
  "이동·존재",
  "식사",
  "행위",
  "발화·인지",
  "수수",
  "정형 표현",
];

interface HonorificPageState {
  activeCategory: CategoryFilter;
  query: string;
  view: HonorificView;
}

export class HonorificPage extends Component<
  Record<string, never>,
  HonorificPageState
> {
  state: HonorificPageState = {
    activeCategory: "전체",
    query: "",
    view: "reference",
  };

  private handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ query: event.target.value });
  };

  private getFilteredEntries() {
    const normalizedQuery = this.state.query.trim().toLowerCase();

    return honorificEntries.filter((entry) => {
      const matchesCategory =
        this.state.activeCategory === "전체" ||
        entry.category === this.state.activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          entry.standard,
          entry.meaningKo,
          ...entry.respectful,
          ...entry.humbleRecipient,
          ...entry.humbleNeutral,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    });
  }

  render() {
    const filteredEntries = this.getFilteredEntries();

    return (
      <section className="honorific-section">
        <div className="honorific-hero">
          <div>
            <span className="honorific-eyebrow">敬語 · 특별 동사 일람</span>
            <h2>존경어와 겸양어</h2>
            <p>
              상대방의 행동을 높이는 존경어와, 자신의 행동을 낮추는 겸양어를
              문법 사전과 분리해 정리했습니다.
            </p>
          </div>
          <div className="honorific-view-tabs" aria-label="경어 화면 선택">
            <button
              className={this.state.view === "reference" ? "active" : ""}
              type="button"
              onClick={() => this.setState({ view: "reference" })}
            >
              일람표
            </button>
            <button
              className={this.state.view === "quiz" ? "active" : ""}
              type="button"
              onClick={() => this.setState({ view: "quiz" })}
            >
              연습문제
              <span>{honorificQuizQuestions.length}</span>
            </button>
          </div>
        </div>

        {this.state.view === "quiz" ? (
          <div className="honorific-quiz-shell">
            <HonorificQuiz questions={honorificQuizQuestions} />
          </div>
        ) : (
          <>
            <div className="honorific-principles">
              <article>
                <span>尊敬語</span>
                <strong>상대방의 행동을 높임</strong>
                <p>선생님·손님·상사 등 존경할 대상이 주어일 때 사용합니다.</p>
              </article>
              <article>
                <span>謙譲語 I</span>
                <strong>상대방을 향한 내 행동을 낮춤</strong>
                <p>찾아뵙다, 보여 드리다, 말씀드리다처럼 상대와 연결됩니다.</p>
              </article>
              <article>
                <span>謙譲語 II</span>
                <strong>내 행동 자체를 정중하게 낮춤</strong>
                <p>参る·申す·いたす처럼 존경할 대상이 직접 없어도 사용합니다.</p>
              </article>
            </div>

            <div className="honorific-toolbar">
              <input
                type="search"
                placeholder="일반형·존경어·겸양어 검색"
                value={this.state.query}
                onChange={this.handleQueryChange}
              />
              <div className="honorific-filters">
                {categories.map((category) => (
                  <button
                    className={
                      this.state.activeCategory === category ? "active" : ""
                    }
                    key={category}
                    type="button"
                    onClick={() => this.setState({ activeCategory: category })}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="honorific-result-count">
              {filteredEntries.length}개 항목
            </div>
            <HonorificEntryTable entries={filteredEntries} />
            <HonorificPatterns patterns={honorificPatterns} />

            <aside className="honorific-source-note">
              <strong>이미지 판독 메모</strong>
              <p>
                이미지 1과 2의 인쇄 내용을 통합했습니다. 이미지 2의
                お越しになる·頂戴する·承る·思し召す·存じ上げる·ご覧に入れる도
                함께 반영했습니다.
              </p>
              <p>
                이미지 1 마지막의 「動詞＋ていきます」「動詞＋できます」 두 줄은
                인쇄 상태와 문맥이 불명확하므로 확정 정답에서 제외하고 위
                ‘판독 주의’ 카드에만 보존했습니다.
              </p>
            </aside>
          </>
        )}
      </section>
    );
  }
}
