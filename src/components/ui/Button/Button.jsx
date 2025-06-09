// src/components/ui/Button/Button.jsx
import React from 'react';
import styles from './Button.module.css';

const Button = ({
    children,
    variant = 'primary', // 'primary', 'secondary', 'danger', 'tab'
    tab = false,
    active = false,
    className = '',
    ...props
}) => {
    // Compose class names based on props
    let btnClass = styles.button;
    if (variant && styles[variant]) btnClass += ` ${styles[variant]}`;
    if (tab) btnClass += ` ${styles.tab}`;
    if (active) btnClass += ` ${styles.active}`;
    if (className) btnClass += ` ${className}`;

    return (
        <button
            className={btnClass}
            aria-current={active ? 'true' : undefined}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;