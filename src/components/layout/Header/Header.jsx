// client/src/components/Header/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import styles from "./Header.module.css";

const Header = () => {
  const { theme, changeTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = !!user;

  const themes = [
    { value: "light", label: "Light" },
    { value: "tokyo-night", label: "Tokyo Night" },
    { value: "dark", label: "Dark" },
    { value: "high-contrast-dark", label: "High Contrast Dark" },
    { value: "vibrant-green", label: "Vibrant Green" },
    { value: "vibrant-orange", label: "Vibrant Orange" },
  ];

  const handleThemeChange = (event) => {
    changeTheme(event.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className={styles.header}>
      {/* Left: Logo and Theme */}
      <div className={styles.leftSection}>
        <Link to="/" className={styles.logoText}>
          FinApp
        </Link>
        <div className={styles.themeToggleContainer}>
          <label htmlFor="theme-select">Choose Theme</label>
          <select
            id="theme-select"
            className={styles.themeSelect}
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
      </div>

      {/* Center: Navigation */}
      <nav className={styles.navigation}>
        <Link to="/" className={styles.navLink}>
          Home
        </Link>
        <Link to="/demo" className={styles.navLink}>
          Demo
        </Link>
        <Link to="/education" className={styles.navLink}>
          Education
        </Link>
        {isLoggedIn && (
          <Link to="/dashboard" className={styles.navLink}>
            Dashboard
          </Link>
        )}
      </nav>

      {/* Right: Auth Section */}
      <div className={styles.authSection}>
        {isLoggedIn && user ? (
          <>
            <span className={styles.welcomeMessage}>
              Welcome, {user.username}!
            </span>
            <button className={styles.navLink} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.navLink}>
              Login
            </Link>
            <Link to="/signup" className={styles.navLink}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
