import type { GrammarItem } from "../../types/grammar";
import { getFrequencyStars, getRegisterColor } from "../../utils/grammarSearch";

interface GrammarDetailProps {
  item: GrammarItem | null;
  isFavorite: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onGoPrevious: () => void;
  onGoNext: () => void;
  onSimilarSearch: (query: string) => void;
  onToggleFavorite: (grammarId: string) => void;
}

export function GrammarDetail({
  item,
  isFavorite,
  canGoPrevious,
  canGoNext,
  onGoPrevious,
  onGoNext,
  onSimilarSearch,
  onToggleFavorite,
}: GrammarDetailProps) {
  if (item === null) {
    return (
      <div className="detail-panel">
        <div className="detail-empty">
          <div className="big">文</div>
          <p>왼쪽 목록에서 문법을 선택하세요</p>
        </div>
      </div>
    );
  }

  const registerColor = getRegisterColor(item.register);

  return (
    <div className="detail-panel">
      <div className="grammar-header">
        <div className="grammar-title">{item.expression}</div>
        <div className="grammar-num-badge">No.{item.noLabel}</div>
        <button
          aria-pressed={isFavorite}
          className={`favorite-btn${isFavorite ? " active" : ""}`}
          type="button"
          onClick={() => onToggleFavorite(item.id)}
        >
          <span aria-hidden="true">{isFavorite ? "★" : "☆"}</span>
          {isFavorite ? "즐겨찾기됨" : "즐겨찾기"}
        </button>
      </div>

      <div className="meta-row">
        <div className="meta-chip" style={{ borderColor: `${registerColor}33`, color: registerColor }}>
          {item.register}
        </div>
        <div className="meta-chip freq-chip">{getFrequencyStars(item.frequency)}</div>
        <div className="meta-chip">{item.level}</div>
      </div>

      <div className="info-grid">
        <div className="info-card full">
          <div className="info-label">접속형</div>
          <div className="info-value mono">{item.connection}</div>
        </div>
        <div className="info-card">
          <div className="info-label">의미</div>
          <div className="info-value">{item.meaningKo}</div>
        </div>
        <div className="info-card">
          <div className="info-label">뉘앙스</div>
          <div className="nuance-text">{item.nuanceKo}</div>
        </div>
        {item.warningKo !== undefined && (
          <div className="info-card full warn-card">
            <div className="info-label">오용 주의</div>
            <div className="info-value warn-text">{item.warningKo}</div>
          </div>
        )}
        {item.similarExpressionNames.length > 0 && (
          <div className="info-card full">
            <div className="info-label">유사 문법 (클릭해서 검색)</div>
            <div className="sim-tags">
              {item.similarExpressionNames.map((name) => (
                <button className="sim-tag" key={name} type="button" onClick={() => onSimilarSearch(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="examples-section">
        <div className="examples-title">예문</div>
        {item.examples.map((example) => (
          <div className="example-block" key={example.id}>
            <div className="example-jp">{example.japanese}</div>
            <div className="example-kr">{example.korean}</div>
          </div>
        ))}
      </div>

      <div className="nav-arrows">
        <button className="arrow-btn" disabled={!canGoPrevious} type="button" onClick={onGoPrevious}>
          ← 이전
        </button>
        <button className="arrow-btn" disabled={!canGoNext} type="button" onClick={onGoNext}>
          다음 →
        </button>
      </div>
    </div>
  );
}
