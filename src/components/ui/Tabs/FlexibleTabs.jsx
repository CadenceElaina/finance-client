import React, { useState, useEffect } from 'react';
import styles from './Tabs.module.css';
import DropdownTabs from './DropdownTabs';

const FlexibleTabs = ({
    tabs,
    activeTabId,
    onTabChange,
    className = '',
    contentClassName = '',
    smallApp = false,
    alwaysShowInnerTabsAsRow = false, // If true, tabs with innerTabs always use DropdownTabs (inline)
}) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);

    const [activeInnerTabId, setActiveInnerTabId] = useState(() => {
        const currentMainTab = tabs.find(tab => tab.id === activeTabId);
        if (currentMainTab?.innerTabs?.length > 0) {
            const innerTabs = currentMainTab.innerTabs;
            // Determine if dropdown behavior should be used for the initial active main tab
            const shouldUseDropdown = (alwaysShowInnerTabsAsRow || smallApp) && currentMainTab.innerTabs?.length > 0;
            if (shouldUseDropdown && innerTabs.some(t => t.id === 'showAll')) {
                return 'showAll';
            }
            return innerTabs[0].id; // Default to first inner tab
        }
        return null;
    });

    useEffect(() => {
        const newActiveMainTab = tabs.find(tab => tab.id === activeTabId);
        if (newActiveMainTab?.innerTabs?.length > 0) {
            const innerTabs = newActiveMainTab.innerTabs;
            // If current activeInnerTabId is not valid for the new main tab, set a default.
            if (!innerTabs.some(it => it.id === activeInnerTabId)) {
                const shouldUseDropdownForNewMainTab = (alwaysShowInnerTabsAsRow || smallApp) && newActiveMainTab.innerTabs?.length > 0;
                if (shouldUseDropdownForNewMainTab && innerTabs.some(it => it.id === 'showAll')) {
                    setActiveInnerTabId('showAll');
                } else {
                    setActiveInnerTabId(innerTabs[0].id);
                }
            }
        } else {
            setActiveInnerTabId(null); // New main tab has no inner tabs
        }
    }, [activeTabId, tabs, activeInnerTabId, smallApp, alwaysShowInnerTabsAsRow]);


    return (
        <div className={`${styles.tabsContainer} ${className}`}>
            <div className={styles.tabHeaders} role="tablist" aria-label="Main tabs">
                {tabs.map(tab => {
                    const hasInnerTabs = tab.innerTabs && tab.innerTabs.length > 0;
                    // Determine if this specific main tab should use the DropdownTabs component
                    const useDropdownForThisTab = hasInnerTabs && (alwaysShowInnerTabsAsRow || smallApp);

                    return (
                        <React.Fragment key={tab.id}>
                            {useDropdownForThisTab ? (
                                <DropdownTabs
                                    tabs={tab.innerTabs}
                                    activeTabId={activeTabId === tab.id ? activeInnerTabId : (tab.innerTabs.find(it => it.id === 'showAll') ? 'showAll' : tab.innerTabs[0].id)}
                                    onTabChange={innerId => { // Called when an inner tab (menu item) is clicked
                                        setActiveInnerTabId(innerId);
                                        if (activeTabId !== tab.id) { // Ensure main tab is active
                                            onTabChange(tab.id);
                                        }
                                    }}
                                    label={tab.label}
                                    isActive={activeTabId === tab.id}
                                    inline={true} // Renders inner tabs as a row
                                    isShowingAll={activeTabId === tab.id && activeInnerTabId === 'showAll'}
                                    onDropdownButtonClick={() => { // Called when the main tab (acting as dropdown button) is clicked
                                        if (activeTabId !== tab.id) {
                                            onTabChange(tab.id); // This will trigger useEffect to set a default inner tab
                                            // Then explicitly set to 'showAll' if that's the desired state on click
                                            if (tab.innerTabs.some(it => it.id === 'showAll')) {
                                                setActiveInnerTabId('showAll');
                                            } else {
                                                setActiveInnerTabId(tab.innerTabs[0].id);
                                            }
                                        } else {
                                            // If already active, toggle or set to a default like 'showAll'
                                            // DropdownTabs handles its own open state. We ensure inner tab state.
                                            if (tab.innerTabs.some(it => it.id === 'showAll')) {
                                                 // If current inner is showAll, maybe cycle or pick first? Or let DropdownTabs handle open/close.
                                                // For now, ensure 'showAll' or first if dropdown button is clicked.
                                                setActiveInnerTabId(activeInnerTabId === 'showAll' && tab.innerTabs.length > 1 ? tab.innerTabs.find(it => it.id !== 'showAll')?.id || tab.innerTabs[0].id :
                                                                    tab.innerTabs.some(it => it.id === 'showAll') ? 'showAll' : tab.innerTabs[0].id);
                                            } else {
                                                setActiveInnerTabId(tab.innerTabs[0].id);
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <button
                                    className={`${styles.tabHeader} ${activeTabId === tab.id ? styles.active : ''}`}
                                    onClick={() => {
                                        onTabChange(tab.id);
                                    }}
                                    aria-current={activeTabId === tab.id ? 'true' : undefined}
                                    type="button"
                                >
                                    {tab.label}
                                </button>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* The separate inner tabs row rendering is removed as DropdownTabs handles it when inline */}

            <div className={`${styles.tabContent} ${contentClassName}`}>
                {activeTab?.component && activeTab.component({
                    smallApp: smallApp, // Pass original smallApp status for content
                    activeInnerTabId: activeInnerTabId
                })}
            </div>
        </div>
    );
};

export default FlexibleTabs;