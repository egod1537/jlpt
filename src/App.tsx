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
import { N1KanjiPage } from "./components/Vocabulary/N1KanjiPage";
import { N1WordsPage } from "./components/Vocabulary/N1WordsPage";
import { n2Grammar } from "./data/grammar";
import { n1Kanji, n1Words } from "./data/vocabulary";
import { GrammarFavoritesRepository } from "./services/GrammarFavoritesRepository";
import type { GrammarItem } from "./types/grammar";

const grammarItems: readonly GrammarItem[] = n2Grammar;
const grammarItemIds = grammarItems.map((item) => item.id);
const ARCHIVE_ROUTE_DATE = "2026-07-17";
const tabPaths: Record<AppTab, string> = {
  dict: `/${ARCHIVE_ROUTE_DATE}`,
  honorific: `/${ARCHIVE_ROUTE_DATE}/honorific`,
  n1Kanji: "/n1-kanji",
  quiz: `/${ARCHIVE_ROUTE_DATE}/quiz`,
  n1Words: "/n1-words",
};

const n1WordStudyLinks = [
  { active: true, href: "/n1-words", label: "단어" },
  { active: false, href: "/n1-kanji", label: "한자" },
] as const;

function getTabFromPath(pathname: string): AppTab {
  switch (pathname.replace(/\/+$/, "") || "/") {
    case `/${ARCHIVE_ROUTE_DATE}`:
      return "dict";
    case `/${ARCHIVE_ROUTE_DATE}/honorific`:
      return "honorific";
    case `/${ARCHIVE_ROUTE_DATE}/quiz`:
      return "quiz";
    case "/":
    case "/n1-words":
      return "n1Words";
    case "/n1-kanji":
      return "n1Kanji";
    default:
      return "n1Words";
  }
}

interface AppState {
  activeTab: AppTab;
  favoriteIds: string[];
  hasSelectedItem: boolean;
  mobileDictionaryPane: MobileDictionaryPane;
}

export class App extends Component<Record<string, never>, AppState> {
  private readonly favoritesRepository = new GrammarFavoritesRepository(grammarItemIds);

  state: AppState = {
    activeTab: getTabFromPath(window.location.pathname),
    favoriteIds: this.favoritesRepository.load(),
    hasSelectedItem: false,
    mobileDictionaryPane: "list",
  };

  componentDidMount(): void {
    window.addEventListener("popstate", this.handlePopState);
  }

  componentWillUnmount(): void {
    window.removeEventListener("popstate", this.handlePopState);
  }

  private handlePopState = (): void => {
    this.setState({
      activeTab: getTabFromPath(window.location.pathname),
      mobileDictionaryPane:
        getTabFromPath(window.location.pathname) === "dict"
          ? "list"
          : this.state.mobileDictionaryPane,
    });
  };

  private navigateToTab(
    activeTab: AppTab,
    mobileDictionaryPane?: MobileDictionaryPane,
  ): void {
    const nextPath = tabPaths[activeTab];

    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }

    if (mobileDictionaryPane === undefined) {
      this.setState({ activeTab });
      return;
    }

    this.setState({ activeTab, mobileDictionaryPane });
  }

  private handleTabChange = (activeTab: AppTab): void => {
    this.navigateToTab(activeTab);
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
    if (
      nextTab === "quiz" ||
      nextTab === "honorific" ||
      nextTab === "n1Words"
    ) {
      this.navigateToTab(nextTab);
      return;
    }

    this.navigateToTab("dict", nextTab);
  };

  render() {
    const favoriteIdSet = new Set(this.state.favoriteIds);
    const isN1StudyRoute =
      this.state.activeTab === "n1Words" || this.state.activeTab === "n1Kanji";

    return (
      <div className="app-shell">
        {!isN1StudyRoute && (
          <Header
            activeTab={this.state.activeTab}
            grammarCount={grammarItems.length}
            onTabChange={this.handleTabChange}
          />
        )}
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
          <div
            className="n1-words-view"
            style={{
              display: this.state.activeTab === "n1Words" ? "flex" : "none",
              flex: 1,
              minHeight: 0,
            }}
          >
            <N1WordsPage studyLinks={n1WordStudyLinks} words={n1Words} />
          </div>
          <div
            className="n1-words-view"
            style={{
              display: this.state.activeTab === "n1Kanji" ? "flex" : "none",
              flex: 1,
              minHeight: 0,
            }}
          >
            <N1KanjiPage kanji={n1Kanji} />
          </div>
        </MainLayout>
        {!isN1StudyRoute && (
          <MobileDock
            activeTab={
              this.state.activeTab === "quiz" ||
              this.state.activeTab === "honorific" ||
              this.state.activeTab === "n1Words"
                ? this.state.activeTab
                : this.state.mobileDictionaryPane
            }
            hasSelectedItem={this.state.hasSelectedItem}
            onTabChange={this.handleMobileTabChange}
          />
        )}
      </div>
    );
  }
}
