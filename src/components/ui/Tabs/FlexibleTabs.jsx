// FlexibleTabs.jsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './Tabs.module.css';

const FlexibleTabs = ({
    tabs,
    activeTabId,
    onTabChange,
    className = '',
    contentClassName = '',
    smallApp = false,
}) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    const [activeInnerTabId, setActiveInnerTabId] = useState(
        activeTab?.innerTabs?.[0]?.id || null
    );
    const [innerTabAnimationStates, setInnerTabAnimationStates] = useState({});
    const animationTimeouts = useRef([]);

    useEffect(() => {
        return () => {
            animationTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
            animationTimeouts.current = [];
        };
    }, [activeTabId, activeTab?.innerTabs]);

    // Effect to initialize inner tab states when the main tab changes or inner tabs data changes
    useEffect(() => {
        if (activeTab?.innerTabs && activeTab.innerTabs.length > 0) {
            const initialStates = {};
            activeTab.innerTabs.forEach(tab => {
                // Initialize all tabs in their default, visible state
                initialStates[tab.id] = styles.innerTabDefault;
            });
            setInnerTabAnimationStates(initialStates);

            const defaultInnerTabId = activeTab.innerTabs[0].id;
            if (!activeTab.innerTabs.some(t => t.id === activeInnerTabId)) {
                setActiveInnerTabId(defaultInnerTabId);
            }
        } else {
            setInnerTabAnimationStates({});
            setActiveInnerTabId(null);
        }
    }, [activeTabId, activeTab?.innerTabs]);


    const handleInnerTabClick = (clickedTabId) => {
        if (clickedTabId === activeInnerTabId) return;

        animationTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
        animationTimeouts.current = [];

        const slideOutDelay = 50; // Delay between each tab starting its slide-out animation
        const slideOutTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tab-slide-duration')) * 1000 || 250;
        const convergeTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tab-converge-duration')) * 1000 || 400;

        // Phase 1: Animate non-clicked tabs sliding out one by one
        activeTab.innerTabs.forEach((tab, index) => {
            if (tab.id !== clickedTabId) {
                const timeoutId = setTimeout(() => {
                    setInnerTabAnimationStates(prevStates => ({
                        ...prevStates,
                        [tab.id]: styles.innerTabSlideOut
                    }));
                }, index * slideOutDelay);
                animationTimeouts.current.push(timeoutId);
            } else {
                // For the clicked tab, ensure it remains in its active-like state
                setInnerTabAnimationStates(prevStates => ({
                    ...prevStates,
                    [tab.id]: styles.innerTabActiveConverge
                }));
            }
        });

        // Calculate total time for all tabs to finish sliding out
        const totalSlideOutPhaseDuration = (activeTab.innerTabs.length - 1) * slideOutDelay + slideOutTransitionDuration;

        // Phase 2: After tabs have slid out, prepare for the "converge/fall in" effect for all tabs
        const prepareConvergeTimeoutId = setTimeout(() => {
            // Instantaneously move all non-active tabs to their invisible 'prepare' state
            // The active tab should maintain its active state.
            const prepareStates = {};
            activeTab.innerTabs.forEach(tab => {
                if (tab.id !== clickedTabId) {
                    prepareStates[tab.id] = styles.innerTabPrepareConverge;
                } else {
                    prepareStates[tab.id] = styles.innerTabActiveConverge; // Already set, but explicit
                }
            });
            setInnerTabAnimationStates(prepareStates);

            // Phase 3: A tiny delay to allow browser to register the 'prepare' state, then trigger convergence
            const triggerConvergeTimeoutId = setTimeout(() => {
                setActiveInnerTabId(clickedTabId); // Set the new active inner tab

                const finalStates = {};
                activeTab.innerTabs.forEach(tab => {
                    if (tab.id !== clickedTabId) {
                        // For non-active tabs, remove the 'prepare' class.
                        // Their default state is `innerTabDefault`, so they will animate back to that.
                        finalStates[tab.id] = styles.innerTabDefault;
                    } else {
                        finalStates[tab.id] = styles.innerTabActiveConverge; // Ensure it stays active
                    }
                });
                setInnerTabAnimationStates(finalStates);
            }, 10); // Very short delay
            animationTimeouts.current.push(triggerConvergeTimeoutId);

        }, totalSlideOutPhaseDuration + 50); // Add a small buffer after slide-out to start converge preparation
        animationTimeouts.current.push(prepareConvergeTimeoutId);
    };

    return (
        <div className={`${styles.tabsContainer} ${className}`}>
            <div className={styles.tabHeaders} role="tablist" aria-label="Main tabs">
                {tabs.map(tab =>
                    tab.customHeader ? (
                        <React.Fragment key={tab.id}>
                            {tab.customHeader({
                                isActive: activeTabId === tab.id,
                                setActive: () => onTabChange(tab.id),
                            })}
                        </React.Fragment>
                    ) : (
                        <button
                            key={tab.id}
                            className={`${styles.tabHeader} ${activeTabId === tab.id ? styles.active : ''}`}
                            onClick={() => onTabChange(tab.id)}
                            aria-current={activeTabId === tab.id ? 'true' : undefined}
                            type="button"
                        >
                            {tab.label}
                        </button>
                    )
                )}
            </div>
            <div className={`${styles.tabContent} ${contentClassName}`}>
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
                                className={`
                                    ${styles.menuItem}
                                    ${styles.innerTab}
                                    ${activeInnerTabId === innerTab.id ? styles.active : ''}
                                    ${innerTabAnimationStates[innerTab.id] || ''}
                                `}
                                onClick={() => handleInnerTabClick(innerTab.id)}
                                type="button"
                            >
                                {innerTab.label}
                            </button>
                        ))}
                    </div>
                )}
                {smallApp && activeTab?.innerTabs
                    ? activeTab.innerTabs.find(t => t.id === activeInnerTabId)?.component?.()
                    : activeTab?.component?.()}
            </div>
        </div>
    );
};

export default FlexibleTabs;