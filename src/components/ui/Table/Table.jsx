import React from 'react';
import styles from './Table.module.css';

const Table = ({
    columns,
    data,
    renderRow,
    className = '',
    smallApp = false,
    extraRow,
    ...props
}) => (
    <div className={`${styles.tableContainer} ${smallApp ? styles.smallApp : ''} ${className}`}>
        <table className={styles.table} {...props}>
            <thead>
                <tr>
                    {columns.map(col => (
                        <th key={col.key || col.label}>{col.label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, idx) => renderRow(row, idx))}
                {extraRow && extraRow()}
            </tbody>
        </table>
    </div>
);

export default Table;