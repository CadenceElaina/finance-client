import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext.jsx';
import styles from './Header.module.css';

const Header = () => {
    const { theme, changeTheme } = useTheme();

    const isLoggedIn = false;

    const themes = [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'ultra-dark', label: 'Ultra Dark' },
        { value: 'high-contrast-dark', label: 'High Contrast Dark' },
        { value: 'vibrant-green', label: 'Vibrant Green' },
        { value: 'vibrant-orange', label: 'Vibrant Orange' },
    ];

    const handleThemeChange = (event) => {
        changeTheme(event.target.value);
    };

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
                <label htmlFor="theme-select" className="">Choose Theme</label> {/* For accessibility */}
                <select
                    id="theme-select"
                    className={styles.themeSelect} /* Apply styling via CSS module */
                    value={theme}
                    onChange={handleThemeChange}
                >
                    {themes.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </div>
        </header>
    );
};

export default Header;