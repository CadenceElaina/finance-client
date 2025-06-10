import React from 'react';
import { useBudget } from '../../../../contexts/BudgetContext';
import Section from '../../../../components/ui/Section/Section';
import SectionHeader from '../../../../components/ui/Section/SectionHeader';
import FormLayout from '../../../../components/ui/Form/FormLayout';
import formStyles from '../../../../components/ui/Form/FormLayout.module.css';

const IncomeSection = () => {
    const { budget, updateIncome } = useBudget();
    const income = budget?.income || {};

    const handleIncomeTypeChange = (e) => {
        updateIncome({ type: e.target.value });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target; // Destructure `checked` for checkboxes
        updateIncome({ [name]: type === 'number' ? parseFloat(value) || 0 : (type === 'checkbox' ? checked : value) });
    };

    return (
        <Section header={<SectionHeader title="Income Details" />}>
            <FormLayout>
                <div className={formStyles.radioRowTop}>
                    <label className={formStyles.radioRowLabel}>Income Type:</label>
                    <div className={formStyles.radioRowGroup}>
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
                    <>
                        <div className={formStyles.formGroup}>
                            <label htmlFor="annualPreTax">Annual Salary (Pre-tax):</label>
                            <input
                                type="number"
                                id="annualPreTax"
                                name="annualPreTax"
                                value={income.annualPreTax || ''}
                                onChange={handleChange}
                                placeholder="e.g. 60000"
                                min="0"
                            />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label htmlFor="monthlyAfterTaxCalculated">Calculated Monthly After-tax:</label>
                            <input
                                type="text"
                                id="monthlyAfterTaxCalculated"
                                name="monthlyAfterTaxCalculated"
                                value={`$${(budget.averageIncomeAfterTaxMonthly || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                readOnly
                                disabled
                            />
                        </div>
                    </>
                )}
                {income.type === 'hourly' && (
                    <>
                        <div className={formStyles.formGroup}>
                            <label htmlFor="hourlyRate">Hourly Rate (Pre-tax):</label>
                            <input
                                type="number"
                                id="hourlyRate"
                                name="hourlyRate"
                                value={income.hourlyRate || ''}
                                onChange={handleChange}
                                placeholder="e.g. 25"
                                min="0"
                            />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label htmlFor="expectedAnnualHours">Expected Annual Hours:</label>
                            <input
                                type="number"
                                id="expectedAnnualHours"
                                name="expectedAnnualHours"
                                value={income.expectedAnnualHours || ''}
                                onChange={handleChange}
                                placeholder="e.g. 2080"
                                min="0"
                            />
                        </div>
                    </>
                )}
                {/* This field should only show if salary or hourly calculation is NOT used, or if it's the fallback manual input.
                    If it's always manual, consider the logic for `budget.averageIncomeAfterTaxMonthly` and `income.monthlyAfterTax`.
                    For now, assuming it's a general manual override/input. */}
                <div className={formStyles.formGroup}>
                    <label htmlFor="monthlyAfterTaxManual">Manual Monthly Net Income (After-tax):</label>
                    <input
                        type="number"
                        id="monthlyAfterTaxManual"
                        name="monthlyAfterTax"
                        value={income.monthlyAfterTax || ''}
                        onChange={handleChange}
                        placeholder="e.g. 3000"
                        min="0"
                        required
                    />
                </div>

                <div className={formStyles.formGroup}>
                    <label htmlFor="bonusAfterTax">Annual Bonus (After-tax):</label>
                    <input
                        type="number"
                        id="bonusAfterTax"
                        name="bonusAfterTax"
                        value={income.bonusAfterTax || ''}
                        onChange={handleChange}
                        placeholder="e.g. 500"
                        min="0"
                    />
                </div>
                <div className={formStyles.formGroup}>
                    <label htmlFor="additionalIncomeAfterTax">Annual Additional Income (After-tax):</label>
                    <input
                        type="number"
                        id="additionalIncomeAfterTax"
                        name="additionalIncomeAfterTax"
                        value={income.additionalIncomeAfterTax || ''}
                        onChange={handleChange}
                        placeholder="e.g. 100"
                        min="0"
                    />
                </div>
            </FormLayout>
        </Section>
    );
};

export default IncomeSection;