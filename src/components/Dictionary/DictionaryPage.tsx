import { Component } from "react";
import type { GrammarItem } from "../../types/grammar";
import {
  filterGrammarByCategory,
  grammarCategories,
  searchGrammar,
} from "../../utils/grammarSearch";
import { Sidebar } from "../Layout/Sidebar";
import { GrammarDetail } from "./GrammarDetail";
import { GrammarFilterChips } from "./GrammarFilterChips";
import { GrammarList } from "./GrammarList";
import { GrammarSearchBox } from "./GrammarSearchBox";

export type MobileDictionaryPane = "list" | "detail";

interface DictionaryPageProps {
  favoriteIds: ReadonlySet<string>;
  grammarItems: readonly GrammarItem[];
  mobilePane: MobileDictionaryPane;
  onMobilePaneChange: (pane: MobileDictionaryPane) => void;
  onSelectionChange: (hasSelectedItem: boolean) => void;
  onToggleFavorite: (grammarId: string) => void;
}

interface DictionaryPageState {
  activeCategory: string;
  query: string;
  selectedId: string | null;
}

export class DictionaryPage extends Component<DictionaryPageProps, DictionaryPageState> {
  state: DictionaryPageState = {
    activeCategory: "전체",
    query: "",
    selectedId: null,
  };

  private getFilteredItems(): GrammarItem[] {
    const searchResults = searchGrammar(this.props.grammarItems, this.state.query);
    return filterGrammarByCategory(searchResults, this.state.activeCategory);
  }

  private clearSelection(nextState: Pick<DictionaryPageState, "activeCategory" | "query">): void {
    this.setState({ ...nextState, selectedId: null });
    this.props.onSelectionChange(false);
    this.props.onMobilePaneChange("list");
  }

  private handleQueryChange = (query: string): void => {
    this.clearSelection({ query, activeCategory: this.state.activeCategory });
  };

  private handleCategoryChange = (activeCategory: string): void => {
    this.clearSelection({ activeCategory, query: this.state.query });
  };

  private handleSelect = (item: GrammarItem): void => {
    this.setState({ selectedId: item.id });
    this.props.onSelectionChange(true);
    this.props.onMobilePaneChange("detail");
  };

  private handleSimilarSearch = (query: string): void => {
    const nextItems = filterGrammarByCategory(
      searchGrammar(this.props.grammarItems, query),
      "전체",
    );
    const selectedId = nextItems[0]?.id ?? null;

    this.setState({ activeCategory: "전체", query, selectedId });
    this.props.onSelectionChange(selectedId !== null);
    this.props.onMobilePaneChange(selectedId === null ? "list" : "detail");
  };

  private handleGoPrevious = (): void => {
    const filteredItems = this.getFilteredItems();
    const selectedIndex = filteredItems.findIndex((item) => item.id === this.state.selectedId);
    const previousItem = filteredItems[selectedIndex - 1];

    if (previousItem !== undefined) {
      this.setState({ selectedId: previousItem.id });
    }
  };

  private handleGoNext = (): void => {
    const filteredItems = this.getFilteredItems();
    const selectedIndex = filteredItems.findIndex((item) => item.id === this.state.selectedId);
    const nextItem = filteredItems[selectedIndex + 1];

    if (nextItem !== undefined) {
      this.setState({ selectedId: nextItem.id });
    }
  };

  render() {
    const filteredItems = this.getFilteredItems();
    const selectedIndex = filteredItems.findIndex((item) => item.id === this.state.selectedId);
    const selectedItem = selectedIndex >= 0 ? filteredItems[selectedIndex] ?? null : null;

    return (
      <section className="dict-section" data-mobile-pane={this.props.mobilePane}>
        <Sidebar>
          <GrammarSearchBox query={this.state.query} onQueryChange={this.handleQueryChange} />
          <GrammarFilterChips
            activeCategory={this.state.activeCategory}
            categories={grammarCategories}
            onCategoryChange={this.handleCategoryChange}
          />
          <GrammarList
            favoriteIds={this.props.favoriteIds}
            items={filteredItems}
            selectedId={this.state.selectedId}
            onSelect={this.handleSelect}
          />
        </Sidebar>
        <GrammarDetail
          canGoNext={selectedIndex >= 0 && selectedIndex < filteredItems.length - 1}
          canGoPrevious={selectedIndex > 0}
          isFavorite={
            selectedItem !== null && this.props.favoriteIds.has(selectedItem.id)
          }
          item={selectedItem}
          onGoNext={this.handleGoNext}
          onGoPrevious={this.handleGoPrevious}
          onSimilarSearch={this.handleSimilarSearch}
          onToggleFavorite={this.props.onToggleFavorite}
        />
      </section>
    );
  }
}
