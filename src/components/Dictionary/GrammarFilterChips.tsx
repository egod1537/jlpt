import type { GrammarCategory } from "../../types/grammar";

interface GrammarFilterChipsProps {
  categories: readonly GrammarCategory[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function GrammarFilterChips({
  categories,
  activeCategory,
  onCategoryChange,
}: GrammarFilterChipsProps) {
  return (
    <div className="filter-row">
      {categories.map((category) => (
        <button
          className={`filter-chip${category.label === activeCategory ? " active" : ""}`}
          key={category.label}
          type="button"
          onClick={() => onCategoryChange(category.label)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
