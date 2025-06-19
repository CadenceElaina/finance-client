import React, { useState, useEffect } from "react";
import { useFinancialData } from "../../../../contexts/FinancialDataContext";
import Section from "../../../../components/ui/Section/Section";
import SectionHeader from "../../../../components/ui/Section/SectionHeader";
import FormLayout from "../../../../components/ui/Form/FormLayout";
import Button from "../../../../components/ui/Button/Button";
import formStyles from "../../../../components/ui/Form/FormLayout.module.css";
import budgetStyles from "./budget.module.css";

const EMPTY_INCOME = {
  type: "salary",
  annualPreTax: 0,
  monthlyAfterTax: 0,
  hourlyRate: null,
  expectedAnnualHours: null,
  bonusAfterTax: 0,
  additionalIncomeAfterTax: 0,
};

const IncomeTab = () => {
  const { data, updateIncome, saveData } = useFinancialData();
  const income = data.budget?.income || EMPTY_INCOME;

  // Local state for form fields
  const [form, setForm] = useState(income);

  // Sync local state with context on mount or when budget changes
  useEffect(() => {
    setForm(income);
  }, [income]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value === "" ? "" : parseFloat(value)) : value,
    }));
  };

  const handleTypeChange = (e) => {
    setForm((prev) => ({
      ...prev,
      type: e.target.value,
    }));
  };

  const handleSave = () => {
    updateIncome(form);
    saveData({ ...data, budget: { ...data.budget, income: form } });
  };

  const handleClear = () => {
    updateIncome(EMPTY_INCOME);
    saveData({ ...data, budget: { ...data.budget, income: EMPTY_INCOME } });
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
                name="type"
                value="hourly"
                checked={form.type === "hourly"}
                onChange={handleTypeChange}
              />{" "}
              Hourly
            </label>
            <label>
              <input
                type="radio"
                name="type"
                value="salary"
                checked={form.type === "salary"}
                onChange={handleTypeChange}
              />{" "}
              Salary
            </label>
          </div>
        </div>

        {form.type === "salary" && (
          <>
            <div className={formStyles.formGroup}>
              <label htmlFor="annualPreTax">Annual Salary (Pre-tax):</label>
              <input
                type="number"
                id="annualPreTax"
                name="annualPreTax"
                value={form.annualPreTax}
                onChange={handleChange}
                placeholder="e.g. 60000"
                min="0"
              />
            </div>
          </>
        )}
        {form.type === "hourly" && (
          <>
            <div className={formStyles.formGroup}>
              <label htmlFor="hourlyRate">Hourly Rate (Pre-tax):</label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={form.hourlyRate}
                onChange={handleChange}
                placeholder="e.g. 25"
                min="0"
              />
            </div>
            <div className={formStyles.formGroup}>
              <label htmlFor="expectedAnnualHours">
                Expected Annual Hours:
              </label>
              <input
                type="number"
                id="expectedAnnualHours"
                name="expectedAnnualHours"
                value={form.expectedAnnualHours}
                onChange={handleChange}
                placeholder="e.g. 2080"
                min="0"
              />
            </div>
          </>
        )}

        <div className={formStyles.formGroup}>
          <label htmlFor="monthlyAfterTax">
            Manual Monthly Net Income (After-tax):
          </label>
          <input
            type="number"
            id="monthlyAfterTax"
            name="monthlyAfterTax"
            value={form.monthlyAfterTax}
            onChange={handleChange}
            placeholder="e.g. 3000"
            min="0"
          />
        </div>

        <div className={formStyles.formGroup}>
          <label htmlFor="bonusAfterTax">Annual Bonus (After-tax):</label>
          <input
            type="number"
            id="bonusAfterTax"
            name="bonusAfterTax"
            value={form.bonusAfterTax}
            onChange={handleChange}
            placeholder="e.g. 500"
            min="0"
          />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="additionalIncomeAfterTax">
            Annual Additional Income (After-tax):
          </label>
          <input
            type="number"
            id="additionalIncomeAfterTax"
            name="additionalIncomeAfterTax"
            value={form.additionalIncomeAfterTax}
            onChange={handleChange}
            placeholder="e.g. 100"
            min="0"
          />
        </div>
      </FormLayout>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Button onClick={handleSave} variant="primary">
          Save Income
        </Button>
        <Button onClick={handleClear} variant="danger">
          Clear Income
        </Button>
      </div>
    </Section>
  );
};

export default IncomeTab;
