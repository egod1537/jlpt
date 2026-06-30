import { Component } from "react";
import {
  DictionaryPage,
  type MobileDictionaryPane,
} from "./components/Dictionary/DictionaryPage";
import { HonorificPage } from "./components/Honorific/HonorificPage";
import { Header, type AppTab } from "./components/Layout/Header";
import { MainLayout } from "./components/Layout/MainLayout";
import { MobileDock, type MobileDockTab } from "./components/Layout/MobileDock";
import { QuizPage } from "./components/Quiz/QuizPage";
import { n2Grammar } from "./data/grammar";
import { GrammarFavoritesRepository } from "./services/GrammarFavoritesRepository";
import type { GrammarItem } from "./types/grammar";

const grammarItems: readonly GrammarItem[] = n2Grammar;
const grammarItemIds = grammarItems.map((item) => item.id);

interface AppState {
  activeTab: AppTab;
  favoriteIds: string[];
  hasSelectedItem: boolean;
  mobileDictionaryPane: MobileDictionaryPane;
}

export class App extends Component<Record<string, never>, AppState> {
  private readonly favoritesRepository = new GrammarFavoritesRepository(grammarItemIds);

  state: AppState = {
    activeTab: "dict",
    favoriteIds: this.favoritesRepository.load(),
    hasSelectedItem: false,
    mobileDictionaryPane: "list",
  };

  private handleTabChange = (activeTab: AppTab): void => {
    this.setState({ activeTab });
  };

  private handleMobilePaneChange = (mobileDictionaryPane: MobileDictionaryPane): void => {
    this.setState({ mobileDictionaryPane });
  };

  private handleSelectionChange = (hasSelectedItem: boolean): void => {
    this.setState({ hasSelectedItem });
  };

  private handleToggleFavorite = (grammarId: string): void => {
    this.setState((state) => ({
      favoriteIds: this.favoritesRepository.toggle(state.favoriteIds, grammarId),
    }));
  };

  private handleMobileTabChange = (nextTab: MobileDockTab): void => {
    if (nextTab === "quiz" || nextTab === "honorific") {
      this.setState({ activeTab: nextTab });
      return;
    }

    this.setState({ activeTab: "dict", mobileDictionaryPane: nextTab });
  };

  render() {
    const favoriteIdSet = new Set(this.state.favoriteIds);

    return (
      <div className="app-shell">
        <Header
          activeTab={this.state.activeTab}
          grammarCount={grammarItems.length}
          onTabChange={this.handleTabChange}
        />
        <MainLayout>
          <div style={{ display: this.state.activeTab === "dict" ? "contents" : "none" }}>
            <DictionaryPage
              favoriteIds={favoriteIdSet}
              grammarItems={grammarItems}
              mobilePane={this.state.mobileDictionaryPane}
              onMobilePaneChange={this.handleMobilePaneChange}
              onSelectionChange={this.handleSelectionChange}
              onToggleFavorite={this.handleToggleFavorite}
            />
          </div>
          <div
            className="honorific-view"
            style={{
              display: this.state.activeTab === "honorific" ? "flex" : "none",
              flex: 1,
              minHeight: 0,
            }}
          >
            <HonorificPage />
          </div>
          <div
            className="quiz-view"
            style={{
              display: this.state.activeTab === "quiz" ? "flex" : "none",
              flex: 1,
              minHeight: 0,
            }}
          >
            <QuizPage favoriteIds={this.state.favoriteIds} grammarItems={grammarItems} />
          </div>
        </MainLayout>
        <MobileDock
          activeTab={
            this.state.activeTab === "quiz" ||
            this.state.activeTab === "honorific"
              ? this.state.activeTab
              : this.state.mobileDictionaryPane
          }
          hasSelectedItem={this.state.hasSelectedItem}
          onTabChange={this.handleMobileTabChange}
        />
      </div>
    );
  }
}
