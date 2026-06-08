export type AppTab = "dict" | "quiz";

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="logo">
        文法辞典 <span>일본어 N2 문법 181선</span>
      </div>
      <div className="header-actions">
        <span className="commit-badge" title={`main commit ${__APP_COMMIT_HASH__}`}>
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
            className={`nav-tab${activeTab === "quiz" ? " active" : ""}`}
            type="button"
            onClick={() => onTabChange("quiz")}
          >
            테스트
          </button>
        </nav>
      </div>
    </header>
  );
}
