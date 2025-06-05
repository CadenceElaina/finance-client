// src/components/Button/Button.jsx
import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, onClick, type = 'button', disabled = false }) => {
    return (
        <button
            className={styles.button}
            onClick={onClick}
            type={type}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;