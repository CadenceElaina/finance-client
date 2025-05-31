import React from 'react';
// This path assumes Header.jsx is in 'src/components/layout/Header/'
// and ThemeContext.jsx is in 'src/contexts/'.
// Path: Header -> layout -> components -> src -> contexts
import { useTheme } from '../../../contexts/ThemeContext.jsx';
import { Moon, Sun } from 'lucide-react'; // Import icons
// This path assumes Header.module.css is in the same directory as Header.jsx
import styles from './Header.module.css';

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                {/* Placeholder for your app logo */}
                <span className={styles.logoText}>FinApp</span>
            </div>
            <nav className={styles.navigation}>
                {/* Navigation links can go here */}
                {/* Example: <a href="/" className={styles.navLink}>Dashboard</a> */}
                {/* Example: <a href="/education" className={styles.navLink}>Education</a> */}
            </nav>
            <div className={styles.themeToggleContainer}>
                <button
                    className={styles.themeToggleButton}
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? (
                        <Sun size={24} className={styles.icon} /> // Show sun icon in dark mode
                    ) : (
                        <Moon size={24} className={styles.icon} /> // Show moon icon in light mode
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;