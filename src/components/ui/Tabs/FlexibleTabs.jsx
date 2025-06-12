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

    // Initialize activeInnerTabId.
    // If smallApp mode and the active tab has innerTabs, default to 'showAll'.
    // Otherwise, default to the first inner tab or null.
    const [activeInnerTabId, setActiveInnerTabId] = useState(() => {
        if (smallApp && activeTab?.innerTabs && activeTab.innerTabs.length > 0) {
            return 'showAll';
        }
        return activeTab?.innerTabs?.[0]?.id || null;
    });

    // Update activeInnerTabId when activeTabId or activeTab.innerTabs changes.
    // Logic needs to ensure 'showAll' is the default in smallApp mode.
    useEffect(() => {
        if (activeTab?.innerTabs && activeTab.innerTabs.length > 0) {
            const hasShowAll = activeTab.innerTabs.some(t => t.id === 'showAll');
            const defaultInnerTabId = (smallApp && hasShowAll) ? 'showAll' : activeTab.innerTabs[0].id;

            // Check if the current activeInnerTabId is valid for the new main tab,
            // or if it should be reset to the default for smallApp.
            const isCurrentInnerTabValid = activeTab.innerTabs.some(t => t.id === activeInnerTabId);

            if (!isCurrentInnerTabValid ||
                (smallApp && activeInnerTabId !== 'showAll' && !hasShowAll) || // If in smallApp and not 'showAll' and 'showAll' isn't available
                (activeTab.id !== tabs.find(t => t.innerTabs?.some(it => it.id === activeInnerTabId))?.id) // If main tab changed AND activeInnerTabId belonged to a different main tab
            ) {
                setActiveInnerTabId(defaultInnerTabId);
            }
        } else {
            setActiveInnerTabId(null);
        }
    }, [activeTabId, activeTab?.innerTabs, tabs, smallApp]);


    const [innerTabAnimationStates, setInnerTabAnimationStates] = useState({});
    const animationTimeouts = useRef([]);

    useEffect(() => {
        return () => {
            animationTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
            animationTimeouts.current = [];
        };
    }, [activeTabId, activeTab?.innerTabs]);

    const handleInnerTabClick = (clickedTabId) => {
        if (clickedTabId === activeInnerTabId) return; // Allow re-clicking to reset to 'showAll' if it's the parent tab. This needs adjustment for dropdowns.

        animationTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
        animationTimeouts.current = [];

        const slideOutDelay = 50;
        const slideOutTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tab-slide-duration')) * 1000 || 250;

        // Ensure activeTab.innerTabs is valid before proceeding
        if (!activeTab || !activeTab.innerTabs || activeTab.innerTabs.length === 0) {
            setActiveInnerTabId(clickedTabId); // Fallback if no inner tabs
            return;
        }

        // Phase 1: Animate non-clicked tabs sliding out one by one
        // If clicking 'showAll', we don't animate existing tabs sliding out, we just set the state.
        if (clickedTabId === 'showAll' || activeInnerTabId === 'showAll') {
            // If going to or from 'showAll', no specific slide-out animation for individual inner tabs
            setActiveInnerTabId(clickedTabId);
            setInnerTabAnimationStates({}); // Reset any animation states
            return;
        }


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
                    const isDropdown = smallApp && hasInnerTabs;

                    return (
                        <React.Fragment key={tab.id}>
                            {isDropdown ? (
                                <DropdownTabs
                                    tabs={tab.innerTabs}
                                    activeTabId={activeInnerTabId} // Pass current active inner tab
                                    onTabChange={id => {
                                        // When an inner tab is selected from the dropdown
                                        setActiveInnerTabId(id);
                                        onTabChange(tab.id); // Ensure main tab is also active
                                    }}
                                    label={tab.label}
                                    isActive={activeTabId === tab.id}
                                    inline={true}
                                    // Add a prop to indicate if it's the 'showAll' state for styling if needed
                                    isShowingAll={activeInnerTabId === 'showAll'}
                                    // When the dropdown button is clicked, set activeInnerTabId to 'showAll'
                                    onDropdownButtonClick={() => {
                                        if (activeTabId === tab.id && activeInnerTabId !== 'showAll') {
                                            setActiveInnerTabId('showAll');
                                        }
                                        onTabChange(tab.id); // Ensure parent tab is active
                                    }}
                                />
                            ) : (
                                <button
                                    className={`${styles.tabHeader} ${activeTabId === tab.id ? styles.active : ''}`}
                                    onClick={() => {
                                        onTabChange(tab.id);
                                        // If this main tab has inner tabs and we are in smallApp,
                                        // and this is the currently active main tab,
                                        // clicking it again should default to 'showAll'.
                                        if (smallApp && hasInnerTabs && activeTabId === tab.id) {
                                            setActiveInnerTabId('showAll');
                                        } else if (smallApp && hasInnerTabs) {
                                            // If switching to this main tab, also set to 'showAll'
                                            setActiveInnerTabId('showAll');
                                        }
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
            <div className={`${styles.tabContent} ${contentClassName}`}>
                {activeTab?.component && activeTab.component({
                    smallApp: smallApp,
                    activeInnerTabId: activeInnerTabId // Pass the actual activeInnerTabId
                })}
            </div>
        </div>
    );
};

export default FlexibleTabs;