import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext.jsx';
import { Moon, Sun } from 'lucide-react';
import styles from './Header.module.css';

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    const isLoggedIn = false; // Replace with real auth logic later

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <Link to="/" className={styles.logoText}>FinApp</Link>
            </div>

            <nav className={styles.navigation}>
                <Link to="/" className={styles.navLink}>Home</Link>
                <Link to="/demo" className={styles.navLink}>Demo</Link>
                <Link to="/education" className={styles.navLink}>Education</Link>
                {isLoggedIn && (
                    <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
                )}
                {isLoggedIn ? (
                    <button className={styles.navLink} onClick={() => {/* handle logout */ }}>Logout</button>
                ) : (
                    <>
                        <Link to="/login" className={styles.navLink}>Login</Link>
                        <Link to="/signup" className={styles.navLink}>Sign Up</Link>
                    </>
                )}
            </nav>

            <div className={styles.themeToggleContainer}>
                <button
                    className={styles.themeToggleButton}
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                </button>
            </div>
        </header>
    );
};

export default Header;