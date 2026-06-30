import { PureComponent } from "react";
import type { HonorificPattern } from "../../types/honorific";

interface HonorificPatternsProps {
  patterns: readonly HonorificPattern[];
}

export class HonorificPatterns extends PureComponent<HonorificPatternsProps> {
  render() {
    return (
      <section className="honorific-pattern-section">
        <div className="honorific-section-heading">
          <div>
            <span className="honorific-eyebrow">정형 패턴</span>
            <h3>일반 동사를 높이거나 낮추는 형태</h3>
          </div>
          <p>특별 동사가 없는 경우 사용하는 기본 조립 패턴입니다.</p>
        </div>
        <div className="honorific-pattern-grid">
          {this.props.patterns.map((pattern) => (
            <article
              className={`honorific-pattern-card ${pattern.status}`}
              key={pattern.id}
            >
              <div className="honorific-pattern-title">
                <strong>{pattern.standard}</strong>
                <span>{pattern.status === "confirmed" ? "확인" : "판독 주의"}</span>
              </div>
              <dl>
                <div>
                  <dt>존경어</dt>
                  <dd>{pattern.respectful}</dd>
                </div>
                <div>
                  <dt>겸양어</dt>
                  <dd>{pattern.humble}</dd>
                </div>
              </dl>
              {pattern.note !== undefined && <p>{pattern.note}</p>}
            </article>
          ))}
        </div>
      </section>
    );
  }
}
