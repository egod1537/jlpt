import { useMemo, useState } from "react";
import { GrammarDetail } from "./components/Dictionary/GrammarDetail";
import { GrammarFilterChips } from "./components/Dictionary/GrammarFilterChips";
import { GrammarList } from "./components/Dictionary/GrammarList";
import { GrammarSearchBox } from "./components/Dictionary/GrammarSearchBox";
import { Header, type AppTab } from "./components/Layout/Header";
import { MainLayout } from "./components/Layout/MainLayout";
import { Sidebar } from "./components/Layout/Sidebar";
import { QuizPage } from "./components/Quiz/QuizPage";
import { n2Grammar } from "./data/grammar";
import type { GrammarItem } from "./types/grammar";
import {
  filterGrammarByCategory,
  grammarCategories,
  searchGrammar,
} from "./utils/grammarSearch";

const grammarItems: readonly GrammarItem[] = n2Grammar;

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("dict");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const searchResults = searchGrammar(grammarItems, query);
    return filterGrammarByCategory(searchResults, activeCategory);
  }, [activeCategory, query]);

  const selectedIndex = filteredItems.findIndex((item) => item.id === selectedId);
  const selectedItem = selectedIndex >= 0 ? filteredItems[selectedIndex] : null;

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setSelectedId(null);
  };

  const handleCategoryChange = (nextCategory: string) => {
    setActiveCategory(nextCategory);
    setSelectedId(null);
  };

  const handleSelect = (item: GrammarItem) => {
    setSelectedId(item.id);
  };

  const handleSimilarSearch = (nextQuery: string) => {
    const nextItems = filterGrammarByCategory(searchGrammar(grammarItems, nextQuery), "전체");

    setActiveTab("dict");
    setActiveCategory("전체");
    setQuery(nextQuery);
    setSelectedId(nextItems[0]?.id ?? null);
  };

  const handleGoPrevious = () => {
    const previousItem = filteredItems[selectedIndex - 1];
    if (previousItem !== undefined) {
      setSelectedId(previousItem.id);
    }
  };

  const handleGoNext = () => {
    const nextItem = filteredItems[selectedIndex + 1];
    if (nextItem !== undefined) {
      setSelectedId(nextItem.id);
    }
  };

  return (
    <div className="app-shell">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <MainLayout>
        <section className="dict-section" style={{ display: activeTab === "dict" ? "flex" : "none" }}>
          <Sidebar>
            <GrammarSearchBox query={query} onQueryChange={handleQueryChange} />
            <GrammarFilterChips
              activeCategory={activeCategory}
              categories={grammarCategories}
              onCategoryChange={handleCategoryChange}
            />
            <GrammarList items={filteredItems} selectedId={selectedId} onSelect={handleSelect} />
          </Sidebar>
          <GrammarDetail
            canGoNext={selectedIndex >= 0 && selectedIndex < filteredItems.length - 1}
            canGoPrevious={selectedIndex > 0}
            item={selectedItem}
            onGoNext={handleGoNext}
            onGoPrevious={handleGoPrevious}
            onSimilarSearch={handleSimilarSearch}
          />
        </section>
        <div style={{ display: activeTab === "quiz" ? "flex" : "none", flex: 1, minHeight: 0 }}>
          <QuizPage grammarItems={grammarItems} />
        </div>
      </MainLayout>
    </div>
  );
}
