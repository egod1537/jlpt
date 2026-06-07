import type { GrammarItem } from "../../types/grammar";
import { GrammarListItem } from "./GrammarListItem";

interface GrammarListProps {
  items: readonly GrammarItem[];
  selectedId: string | null;
  onSelect: (item: GrammarItem) => void;
}

export function GrammarList({ items, selectedId, onSelect }: GrammarListProps) {
  return (
    <>
      <div className="count-badge">{items.length}개 항목</div>
      <div className="grammar-list">
        {items.map((item) => (
          <GrammarListItem
            isActive={item.id === selectedId}
            item={item}
            key={item.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  );
}
