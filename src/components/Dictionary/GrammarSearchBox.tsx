interface GrammarSearchBoxProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function GrammarSearchBox({ query, onQueryChange }: GrammarSearchBoxProps) {
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="문법 검색..."
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </div>
  );
}
