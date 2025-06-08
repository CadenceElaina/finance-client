// src/Dashboard/Apps/Tabs.jsx
import React, { useState } from 'react';
import styles from './tabs.module.css';

const Tabs = ({ tabs, initialTabId, className, contentClassName }) => {
    const [activeTabId, setActiveTabId] = useState(initialTabId || (tabs.length > 0 ? tabs[0].id : null));

    if (!activeTabId && tabs.length > 0) {
        setActiveTabId(tabs[0].id); // Fallback to first tab if initialTabId is not provided/invalid
    }

    const ActiveTabContent = tabs.find(tab => tab.id === activeTabId)?.component;

    return (
        <div className={`${styles.tabsContainer} ${className || ''}`}>
            <div className={styles.tabHeaders}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tabHeader} ${activeTabId === tab.id ? styles.active : ''}`}
                        onClick={() => setActiveTabId(tab.id)}
                        disabled={tab.disabled}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className={`${styles.tabContent} ${contentClassName || ''}`}>
                {ActiveTabContent ? <ActiveTabContent /> : null}
            </div>
        </div>
    );
};

export default Tabs; 