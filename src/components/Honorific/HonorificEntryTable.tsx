import { PureComponent } from "react";
import type { HonorificEntry } from "../../types/honorific";

interface HonorificEntryTableProps {
  entries: readonly HonorificEntry[];
}

function renderExpressions(expressions: readonly string[]) {
  if (expressions.length === 0) {
    return <span className="honorific-empty">—</span>;
  }

  return (
    <div className="honorific-expression-list">
      {expressions.map((expression) => (
        <span key={expression}>{expression}</span>
      ))}
    </div>
  );
}

export class HonorificEntryTable extends PureComponent<HonorificEntryTableProps> {
  render() {
    return (
      <div className="honorific-table-wrap">
        <table className="honorific-table">
          <thead>
            <tr>
              <th>일반형</th>
              <th>뜻</th>
              <th>존경어</th>
              <th>
                겸양어 I
                <small>상대방과 관련된 행위</small>
              </th>
              <th>
                겸양어 II
                <small>자기 행위를 낮춤</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {this.props.entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <strong>{entry.standard}</strong>
                  <span className="honorific-category">{entry.category}</span>
                </td>
                <td>{entry.meaningKo}</td>
                <td>{renderExpressions(entry.respectful)}</td>
                <td>{renderExpressions(entry.humbleRecipient)}</td>
                <td>
                  {renderExpressions(entry.humbleNeutral)}
                  {entry.note !== undefined && (
                    <p className="honorific-cell-note">{entry.note}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
