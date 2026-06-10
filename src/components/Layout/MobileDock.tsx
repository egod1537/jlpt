export type MobileDockTab = "list" | "detail" | "quiz";

interface MobileDockProps {
  activeTab: MobileDockTab;
  hasSelectedItem: boolean;
  onTabChange: (tab: MobileDockTab) => void;
}

const tabs: Array<{ id: MobileDockTab; label: string }> = [
  { id: "list", label: "목록" },
  { id: "detail", label: "상세" },
  { id: "quiz", label: "테스트" },
];

export function MobileDock({ activeTab, hasSelectedItem, onTabChange }: MobileDockProps) {
  return (
    <nav className="mobile-dock" aria-label="모바일 주요 화면">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isDisabled = tab.id === "detail" && !hasSelectedItem;

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={`dock-tab${isActive ? " active" : ""}`}
            disabled={isDisabled}
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
          >
            <span className="dock-tab-indicator" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
