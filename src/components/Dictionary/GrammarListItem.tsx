import { PureComponent } from "react";
import type { GrammarItem } from "../../types/grammar";
import { getFrequencyStars, getRegisterColor } from "../../utils/grammarSearch";

interface GrammarListItemProps {
  item: GrammarItem;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (item: GrammarItem) => void;
}

export class GrammarListItem extends PureComponent<GrammarListItemProps> {
  private handleSelect = (): void => {
    this.props.onSelect(this.props.item);
  };

  render() {
    const { item, isActive, isFavorite } = this.props;

    return (
      <button
        className={`grammar-item${isActive ? " active" : ""}`}
        type="button"
        onClick={this.handleSelect}
      >
        <div className="item-row1">
          <span className="item-num">{item.noLabel}</span>
          <span className="item-grammar">{item.expression}</span>
          {isFavorite && (
            <span aria-label="즐겨찾기" className="item-favorite" title="즐겨찾기">
              ★
            </span>
          )}
          <span className="item-freq">{getFrequencyStars(item.frequency)}</span>
          <span
            aria-label={item.register}
            className="lv-dot"
            style={{ background: getRegisterColor(item.register) }}
            title={item.register}
          />
        </div>
        <div className="item-conn">{item.connection}</div>
      </button>
    );
  }
}
