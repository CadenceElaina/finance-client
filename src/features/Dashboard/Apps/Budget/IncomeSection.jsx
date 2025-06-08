// src/features/Dashboard/Apps/Budget/IncomeDetailsSection.jsx
import React from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import styles from './budget.module.css';
import Section from '../../../../components/ui/Section/Section';

const IncomeSection = () => {
    const { budget, updateIncome } = useBudget();
    const income = budget?.income || {};

    const handleIncomeTypeChange = (e) => {
        updateIncome({ type: e.target.value });
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        updateIncome({ [name]: type === 'number' ? parseFloat(value) || 0 : value });
    };

    return (
        <Section>
            <div className={`${styles.section} ${styles.fullWidth}`}>
                <div className={styles.formGroup}>
                    <label>Income Type:</label>
                    <div className={styles.radioGroup}>
                        <label>
                            <input
                                type="radio"
                                name="incomeType"
                                value="hourly"
                                checked={income.type === 'hourly'}
                                onChange={handleIncomeTypeChange}
                            /> Hourly
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="incomeType"
                                value="salary"
                                checked={income.type === 'salary'}
                                onChange={handleIncomeTypeChange}
                            /> Salary
                        </label>

                    </div>
                </div>

                {income.type === 'salary' && (
                    <div className={styles.formGroup}>
                        <label htmlFor="salary">Annual Salary (Pre-tax):</label>
                        <input
                            type="number"
                            id="salary"
                            name="salary"
                            value={income.salary || ''}
                            onChange={handleChange}
                            placeholder="e.g. 30000"
                        />
                        <label htmlFor="salary">Monthly Salary (After-tax):</label>
                        <input
                            type="number"
                            id="salary"
                            name="salary"
                            value={income.salary || ''}
                            onChange={handleChange}
                            placeholder="e.g. 2500"
                        />

                    </div>
                )}

                {income.type === 'hourly' && (
                    <>
                        <div className={styles.formGroup}>
                            <label htmlFor="hourlyRate">Hourly Rate:</label>
                            <input
                                type="number"
                                id="hourlyRate"
                                name="hourlyRate"
                                value={income.hourlyRate || ''}
                                onChange={handleChange}
                                placeholder="e.g. 25"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="expectedAnnualHours">Expected Annual Hours:</label>
                            <input
                                type="number"
                                id="expectedAnnualHours"
                                name="expectedAnnualHours"
                                value={income.expectedAnnualHours || ''}
                                onChange={handleChange}
                                placeholder="e.g. 2080"
                            />
                        </div>
                    </>
                )}

                <div className={styles.formGroup}>
                    <label htmlFor="monthlyIncomeAfterTaxes">Net Monthly Income (After-tax):</label>
                    <input
                        type="number"
                        id="monthlyIncomeAfterTaxes"
                        name="monthlyIncomeAfterTaxes"
                        value={income.monthlyIncomeAfterTaxes || ''}
                        onChange={handleChange}
                        placeholder="e.g. 3000"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="bonus">Annual Bonus (After-tax):</label>
                    <input
                        type="number"
                        id="bonus"
                        name="bonus"
                        value={income.bonus || ''}
                        onChange={handleChange}
                        placeholder="e.g. 500"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="additionalIncome">Annual Additional Income (After-tax):</label>
                    <input
                        type="number"
                        id="additionalIncome"
                        name="additionalIncome"
                        value={income.additionalIncome || ''}
                        onChange={handleChange}
                        placeholder="e.g. 100"
                    />
                </div>

            </div>
        </Section>
    );
};

export default IncomeSection;