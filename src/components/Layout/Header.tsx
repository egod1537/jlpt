import { PureComponent } from "react";

export type AppTab = "dict" | "honorific" | "quiz" | "n1Words";

interface HeaderProps {
  activeTab: AppTab;
  grammarCount: number;
  onTabChange: (tab: AppTab) => void;
}

export class Header extends PureComponent<HeaderProps> {
  render() {
    const { activeTab, grammarCount, onTabChange } = this.props;

    return (
      <header className="app-header">
        <div className="logo">
          文法辞典 <span>일본어 N2 문법 {grammarCount}선</span>
        </div>
        <div className="header-actions">
          <span
            className="commit-badge"
            title={`main commit ${__APP_COMMIT_HASH__}`}
          >
            main: {__APP_COMMIT_HASH__}
          </span>
          <nav className="nav-tabs" aria-label="주요 화면">
            <button
              className={`nav-tab${activeTab === "dict" ? " active" : ""}`}
              type="button"
              onClick={() => onTabChange("dict")}
            >
              사전
            </button>
            <button
              className={`nav-tab${
                activeTab === "honorific" ? " active" : ""
              }`}
              type="button"
              onClick={() => onTabChange("honorific")}
            >
              경어
            </button>
            <button
              className={`nav-tab${activeTab === "quiz" ? " active" : ""}`}
              type="button"
              onClick={() => onTabChange("quiz")}
            >
              테스트
            </button>
            <button
              className={`nav-tab${activeTab === "n1Words" ? " active" : ""}`}
              type="button"
              onClick={() => onTabChange("n1Words")}
            >
              N1 단어
            </button>
          </nav>
        </div>
      </header>
    );
  }
}
