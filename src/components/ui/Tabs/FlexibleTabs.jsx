// src/components/ui/Tabs/FlexibleTabs.jsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './Tabs.module.css';
import DropdownTabs from './DropdownTabs'; // Import DropdownTabs here

const FlexibleTabs = ({
    tabs,
    activeTabId,
    onTabChange,
    className = '',
    contentClassName = '',
    smallApp = false,
}) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);

    // Initialize activeInnerTabId from the first inner tab of the active main tab
    const [activeInnerTabId, setActiveInnerTabId] = useState(() =>
        activeTab?.innerTabs?.[0]?.id || null
    );

    // Update activeInnerTabId when activeTabId or activeTab.innerTabs changes
    useEffect(() => {
        if (activeTab?.innerTabs && activeTab.innerTabs.length > 0) {
            const defaultInnerTabId = activeTab.innerTabs[0].id;
            // Only update if the current activeInnerTabId is not in the new innerTabs list,
            // or if the main tab just changed and it should default.
            if (!activeTab.innerTabs.some(t => t.id === activeInnerTabId) ||
                (activeTab.id !== tabs.find(t => t.innerTabs?.some(it => it.id === activeInnerTabId))?.id) // Check if the activeInnerTabId belongs to a different main tab
            ) {
                setActiveInnerTabId(defaultInnerTabId);
            }
        } else {
            setActiveInnerTabId(null);
        }
    }, [activeTabId, activeTab?.innerTabs, tabs]); // Add 'tabs' to dependencies for comprehensive check

    const [innerTabAnimationStates, setInnerTabAnimationStates] = useState({});
    const animationTimeouts = useRef([]);

    useEffect(() => {
        return () => {
            animationTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
            animationTimeouts.current = [];
        };
    }, [activeTabId, activeTab?.innerTabs]); // No change here, keeps animation cleanup

    const handleInnerTabClick = (clickedTabId) => {
        if (clickedTabId === activeInnerTabId) return;

        animationTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
        animationTimeouts.current = [];

        const slideOutDelay = 50;
        const slideOutTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tab-slide-duration')) * 1000 || 250;
        // const convergeTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tab-converge-duration')) * 1000 || 400; // Not directly used in phase logic below

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
                setInnerTabAnimationStates(prevStates => ({
                    ...prevStates,
                    [tab.id]: styles.innerTabActiveConverge
                }));
            }
        });

        const totalSlideOutPhaseDuration = (activeTab.innerTabs.length - 1) * slideOutDelay + slideOutTransitionDuration;

        // Phase 2: After tabs have slid out, prepare for the "converge/fall in" effect
        const prepareConvergeTimeoutId = setTimeout(() => {
            const prepareStates = {};
            activeTab.innerTabs.forEach(tab => {
                if (tab.id !== clickedTabId) {
                    prepareStates[tab.id] = styles.innerTabPrepareConverge;
                } else {
                    prepareStates[tab.id] = styles.innerTabActiveConverge;
                }
            });
            setInnerTabAnimationStates(prepareStates);

            // Phase 3: Trigger convergence and set new active tab
            const triggerConvergeTimeoutId = setTimeout(() => {
                setActiveInnerTabId(clickedTabId);

                const finalStates = {};
                activeTab.innerTabs.forEach(tab => {
                    finalStates[tab.id] = styles.innerTabDefault; // All revert to default
                });
                // The newly active tab will also inherit active styles via its className
                setInnerTabAnimationStates(finalStates);
            }, 10);
            animationTimeouts.current.push(triggerConvergeTimeoutId);

        }, totalSlideOutPhaseDuration + 50);
        animationTimeouts.current.push(prepareConvergeTimeoutId);
    };

    return (
        <div className={`${styles.tabsContainer} ${className}`}>
            <div className={styles.tabHeaders} role="tablist" aria-label="Main tabs">
                {tabs.map(tab => {
                    const hasInnerTabs = tab.innerTabs && tab.innerTabs.length > 0;
                    const isDropdown = smallApp && hasInnerTabs; // Decide if it should be a dropdown

                    return (
                        <React.Fragment key={tab.id}>
                            {isDropdown ? (
                                <DropdownTabs
                                    tabs={tab.innerTabs} // Pass the inner tabs to DropdownTabs
                                    activeTabId={activeInnerTabId} // Active inner tab
                                    onTabChange={id => {
                                        setActiveInnerTabId(id); // Set the internal inner tab state
                                        onTabChange(tab.id); // Also set the main tab active
                                    }}
                                    label={tab.label} // Use main tab's label for dropdown button
                                    isActive={activeTabId === tab.id} // Is the main tab active?
                                    inline={true} // Usually inline for this use case
                                />
                            ) : (
                                <button
                                    className={`${styles.tabHeader} ${activeTabId === tab.id ? styles.active : ''}`}
                                    onClick={() => onTabChange(tab.id)}
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
            <div className={`${styles.tabContent} ${contentClassName}`}>
                {/* Render the component of the active main tab, passing relevant props */}
                {activeTab?.component && activeTab.component({
                    smallApp: smallApp,
                    activeInnerTabId: activeInnerTabId // Pass the active inner tab ID down
                })}
            </div>
        </div>
    );
};

export default FlexibleTabs;