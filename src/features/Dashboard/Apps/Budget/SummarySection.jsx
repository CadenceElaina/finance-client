// src/features/Dashboard/Apps/Budget/SummarySection.jsx
import React, { useState } from 'react';
import Section from '../../../../components/ui/Section/Section';
import SectionHeader from '../../../../components/ui/Section/SectionHeader';

const PERIOD_OPTIONS = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'annual', label: 'Annual' },
    { id: 'both', label: 'Both' },
];

const TAX_OPTIONS = [
    { id: 'after', label: 'After-tax' },
    { id: 'pre', label: 'Pre-tax' },
    { id: 'both', label: 'Both' },
];

const SummarySection = ({
    period, setPeriod, tax, setTax,
    monthlyIncomeAT, annualIncomeAT, monthlyIncomePT, annualIncomePT,
    monthlyExpenses, annualExpenses,
    monthlyDiscretionaryAT, annualDiscretionaryAT,
    monthlyDiscretionaryPT, annualDiscretionaryPT
}) => {
    const format = (val) =>
        `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const showAfter = tax === 'after' || tax === 'both';
    const showPre = tax === 'pre' || tax === 'both';

    const showMonthly = period === 'monthly' || period === 'both';
    const showAnnual = period === 'annual' || period === 'both';

    const singleColumnSummary = (showMonthly && !showAnnual) || (!showMonthly && showAnnual);

    const renderSummarySection = (periodLabel, income, expenses, discretionary, taxLabel) => (
        <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {periodLabel} {taxLabel ? `(${taxLabel})` : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Income:</span>
                <strong>{format(income)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Expenses:</span>
                <strong>{format(expenses)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discretionary:</span>
                <strong style={{ color: discretionary < 0 ? 'var(--color-danger)' : undefined }}>{format(discretionary)}</strong>
            </div>
        </div>
    );

    const Controls = (
        <div style={{ display: 'flex', gap: 8 }}>
            <div>
                <label htmlFor="period-select" style={{ marginRight: 4 }}>Period</label>
                <select
                    id="period-select"
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                >
                    {PERIOD_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="tax-select" style={{ marginRight: 4 }}>Tax</label>
                <select
                    id="tax-select"
                    value={tax}
                    onChange={e => setTax(e.target.value)}
                >
                    {TAX_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );

    return (
        <Section
            header={
                <SectionHeader
                    title="Summary"
                    right={Controls}
                />
            }
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: singleColumnSummary ? '1fr' : '1fr 1fr',
                gap: 24,
                maxWidth: 700,
                margin: '0 auto'
            }}>
                {showMonthly && (
                    <div>
                        {showAfter && renderSummarySection('Monthly', monthlyIncomeAT, monthlyExpenses, monthlyDiscretionaryAT, 'After-tax')}
                        {showPre && renderSummarySection('Monthly', monthlyIncomePT, monthlyExpenses, monthlyDiscretionaryPT, 'Pre-tax')}
                    </div>
                )}
                {showAnnual && (
                    <div>
                        {showAfter && renderSummarySection('Annual', annualIncomeAT, annualExpenses, annualDiscretionaryAT, 'After-tax')}
                        {showPre && renderSummarySection('Annual', annualIncomePT, annualExpenses, annualDiscretionaryPT, 'Pre-tax')}
                    </div>
                )}
            </div>
        </Section>
    );
};

export default SummarySection;