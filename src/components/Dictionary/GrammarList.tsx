import { PureComponent } from "react";
import type { GrammarItem } from "../../types/grammar";
import { GrammarListItem } from "./GrammarListItem";

interface GrammarListProps {
  favoriteIds: ReadonlySet<string>;
  items: readonly GrammarItem[];
  selectedId: string | null;
  onSelect: (item: GrammarItem) => void;
}

export class GrammarList extends PureComponent<GrammarListProps> {
  render() {
    const { favoriteIds, items, selectedId, onSelect } = this.props;

    return (
      <>
        <div className="count-badge">{items.length}개 항목</div>
        <div className="grammar-list">
          {items.map((item) => (
            <GrammarListItem
              isActive={item.id === selectedId}
              isFavorite={favoriteIds.has(item.id)}
              item={item}
              key={item.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </>
    );
  }
}
