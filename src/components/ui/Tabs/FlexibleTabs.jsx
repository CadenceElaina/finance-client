import React, { useState } from 'react';
import styles from './Tabs.module.css';

const FlexibleTabs = ({
    tabs,
    initialTabId,
    className = '',
    contentClassName = '',
    smallApp = false,
    ...props
}) => {
    const [activeTabId, setActiveTabId] = useState(initialTabId || (tabs.length > 0 ? tabs[0].id : null));
    const activeTab = tabs.find(tab => tab.id === activeTabId);

    // For inner tabs (if present and smallApp)
    const [activeInnerTabId, setActiveInnerTabId] = useState(
        activeTab?.innerTabs?.[0]?.id || null
    );

    React.useEffect(() => {
        // Reset inner tab if main tab changes
        if (activeTab?.innerTabs) {
            setActiveInnerTabId(activeTab.innerTabs[0].id);
        }
    }, [activeTabId]);

    return (
        <div className={`${styles.tabsContainer} ${className}`}>
            <div className={styles.tabHeaders} role="tablist" aria-label="Main tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTabId === tab.id}
                        aria-controls={`tabpanel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        tabIndex={activeTabId === tab.id ? 0 : -1}
                        className={`${styles.tabHeader} ${activeTabId === tab.id ? styles.active : ''}`}
                        onClick={() => setActiveTabId(tab.id)}
                        disabled={tab.disabled}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className={`${styles.tabContent} ${contentClassName}`}>
                {/* If smallApp and innerTabs exist, show inner tabs */}
                {smallApp && activeTab?.innerTabs && (
                    <div className={styles.innerTabs} role="tablist" aria-label="Inner tabs">
                        {activeTab.innerTabs.map(innerTab => (
                            <button
                                key={innerTab.id}
                                role="tab"
                                aria-selected={activeInnerTabId === innerTab.id}
                                aria-controls={`tabpanel-${innerTab.id}`}
                                id={`tab-${innerTab.id}`}
                                tabIndex={activeInnerTabId === innerTab.id ? 0 : -1}
                                className={`${styles.innerTab} ${activeInnerTabId === innerTab.id ? styles.active : ''}`}
                                onClick={() => setActiveInnerTabId(innerTab.id)}
                            >
                                {innerTab.label}
                            </button>
                        ))}
                    </div>
                )}
                {/* Render content */}
                {smallApp && activeTab?.innerTabs
                    ? activeTab.innerTabs.find(t => t.id === activeInnerTabId)?.component?.()
                    : activeTab?.component?.()}
            </div>
        </div>
    );
};

export default FlexibleTabs;