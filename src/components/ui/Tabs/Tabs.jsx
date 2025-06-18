import React, { useState, useEffect } from "react";
import styles from "./Tabs.module.css";
import InnerTabs from "./InnerTabs";

const Tabs = ({
  tabs,
  activeTabId,
  onTabChange,
  className = "",
  contentClassName = "",
  smallApp = false,
  alwaysShowInnerTabsAsRow = false,
}) => {
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const [activeInnerTabId, setActiveInnerTabId] = useState(() => {
    const currentMainTab = tabs.find((tab) => tab.id === activeTabId);
    if (currentMainTab?.innerTabs?.length > 0) {
      const innerTabs = currentMainTab.innerTabs;
      const shouldUseInnerTabs =
        (alwaysShowInnerTabsAsRow || smallApp) &&
        currentMainTab.innerTabs?.length > 0;
      if (shouldUseInnerTabs && innerTabs.some((t) => t.id === "showAll")) {
        return "showAll";
      }
      return innerTabs[0].id;
    }
    return null;
  });

  useEffect(() => {
    const newActiveMainTab = tabs.find((tab) => tab.id === activeTabId);
    if (newActiveMainTab?.innerTabs?.length > 0) {
      const innerTabs = newActiveMainTab.innerTabs;
      if (!innerTabs.some((it) => it.id === activeInnerTabId)) {
        const shouldUseInnerTabsForNewMainTab =
          (alwaysShowInnerTabsAsRow || smallApp) &&
          newActiveMainTab.innerTabs?.length > 0;
        if (
          shouldUseInnerTabsForNewMainTab &&
          innerTabs.some((it) => it.id === "showAll")
        ) {
          setActiveInnerTabId("showAll");
        } else {
          setActiveInnerTabId(innerTabs[0].id);
        }
      }
    } else {
      setActiveInnerTabId(null);
    }
  }, [activeTabId, tabs, activeInnerTabId, smallApp, alwaysShowInnerTabsAsRow]);

  return (
    <div className={`${styles.tabsContainer} ${className}`}>
      <div className={styles.tabHeaders} role="tablist" aria-label="Main tabs">
        {tabs.map((tab) => {
          const hasInnerTabs = tab.innerTabs && tab.innerTabs.length > 0;
          const useInnerTabsForThisTab =
            hasInnerTabs && (alwaysShowInnerTabsAsRow || smallApp);

          return (
            <React.Fragment key={tab.id}>
              {useInnerTabsForThisTab ? (
                <InnerTabs
                  tabs={tab.innerTabs}
                  activeTabId={
                    activeTabId === tab.id
                      ? activeInnerTabId
                      : tab.innerTabs.find((it) => it.id === "showAll")
                      ? "showAll"
                      : tab.innerTabs[0].id
                  }
                  onTabChange={(innerId) => {
                    setActiveInnerTabId(innerId);
                    if (activeTabId !== tab.id) {
                      onTabChange(tab.id);
                    }
                  }}
                  label={tab.label}
                  isActive={activeTabId === tab.id}
                  inline={true}
                  isShowingAll={
                    activeTabId === tab.id && activeInnerTabId === "showAll"
                  }
                  onInnerTabsButtonClick={() => {
                    if (activeTabId !== tab.id) {
                      onTabChange(tab.id);
                      if (tab.innerTabs.some((it) => it.id === "showAll")) {
                        setActiveInnerTabId("showAll");
                      } else {
                        setActiveInnerTabId(tab.innerTabs[0].id);
                      }
                    } else {
                      if (tab.innerTabs.some((it) => it.id === "showAll")) {
                        setActiveInnerTabId(
                          activeInnerTabId === "showAll" &&
                            tab.innerTabs.length > 1
                            ? tab.innerTabs.find((it) => it.id !== "showAll")
                                ?.id || tab.innerTabs[0].id
                            : tab.innerTabs.some((it) => it.id === "showAll")
                            ? "showAll"
                            : tab.innerTabs[0].id
                        );
                      } else {
                        setActiveInnerTabId(tab.innerTabs[0].id);
                      }
                    }
                  }}
                />
              ) : (
                <button
                  className={`${styles.tabHeader} ${
                    activeTabId === tab.id ? styles.active : ""
                  }`}
                  onClick={() => {
                    onTabChange(tab.id);
                  }}
                  aria-current={activeTabId === tab.id ? "true" : undefined}
                  type="button"
                >
                  {tab.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className={`${styles.tabContent} ${contentClassName}`}>
        {activeTab?.component &&
          activeTab.component({
            smallApp: smallApp,
            activeInnerTabId: activeInnerTabId,
          })}
      </div>
    </div>
  );
};

export default Tabs;
