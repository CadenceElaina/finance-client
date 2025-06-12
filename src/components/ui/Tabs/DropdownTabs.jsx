import React, { useRef, useState } from 'react';
import styles from './DropdownTabs.module.css';

const CLOSE_DELAY = 180; // ms

const DropdownTabs = ({
    tabs,
    activeTabId,
    onTabChange,
    label = "More",
    isActive,
    className = '',
    inline = false,
    onDropdownButtonClick // New prop for handling button click
}) => {
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const closeTimeout = useRef(null);
    const dropdownRef = useRef(null);

    // Open dropdown on mouse enter, clear any close timeout
    const handleMouseEnter = () => {
        if (closeTimeout.current) {
            clearTimeout(closeTimeout.current);
            closeTimeout.current = null;
        }
        setClosing(false);
        setOpen(true);
    };

    // Start close delay on mouse leave
    const handleMouseLeave = () => {
        setClosing(true);
        closeTimeout.current = setTimeout(() => {
            setOpen(false);
            setClosing(false);
        }, CLOSE_DELAY);
    };

    // Clean up timeout on unmount
    React.useEffect(() => {
        return () => {
            if (closeTimeout.current) clearTimeout(closeTimeout.current);
        };
    }, []);

    const handleButtonClick = () => {
        // Toggle dropdown open state
        setOpen(prev => !prev);
        setClosing(false);
        if (closeTimeout.current) {
            clearTimeout(closeTimeout.current);
            closeTimeout.current = null;
        }

        // Call the new prop for custom parent tab behavior
        if (onDropdownButtonClick) {
            onDropdownButtonClick();
        }
    };


    return (
        <div
            className={`${styles.sideDropdownTabs} ${className} ${inline ? styles.inlineDropdown : ''}`}
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className={styles.dropdownButton}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-current={isActive ? 'true' : undefined}
                tabIndex={0}
                type="button"
                onClick={handleButtonClick} // Use the new handler
            >
                {label}
                <span className={styles.caret}>&#9654;</span>
            </button>
            {(open || closing) && (
                <div
                    className={`
                        ${styles.dropdownMenu}
                        ${inline ? styles.inlineMenu : ''}
                        ${closing ? styles.closing : ''}
                    `}
                >
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`${styles.menuItem} ${tab.id === activeTabId ? styles.active : ''}`}
                            onClick={() => {
                                setOpen(false);
                                setClosing(false);
                                onTabChange(tab.id);
                            }}
                            tabIndex={0}
                            type="button"
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DropdownTabs;