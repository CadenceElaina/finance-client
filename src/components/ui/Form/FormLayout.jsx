// src/components/ui/Form/FormLayout.jsx
import React from 'react';
import styles from './FormLayout.module.css';

const FormLayout = ({ children, className = '', ...props }) => {
    return (
        <div className={`${styles.formGrid} ${styles.centeredForm} ${className}`} {...props}>
            {children}
        </div>
    );
};

export default FormLayout;