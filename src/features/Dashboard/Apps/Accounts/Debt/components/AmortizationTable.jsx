import React, { useState, useMemo } from "react";
import { formatCurrency, formatCurrencyPrecise } from "../utils/formatting";
import { generateAmortizationSchedule } from "../utils/debtCalculations";
import Button from "../../../../../../components/ui/Button/Button";
import styles from "./AmortizationTable.module.css";

const AmortizationTable = ({ debt, compoundingFrequency, onClose }) => {
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Show 12 months per page

  const schedule = useMemo(() => {
    return generateAmortizationSchedule(
      debt.value,
      debt.interestRate || 0,
      debt.monthlyPayment,
      compoundingFrequency
    );
  }, [
    debt.value,
    debt.interestRate,
    debt.monthlyPayment,
    compoundingFrequency,
  ]);

  const displayedSchedule = useMemo(() => {
    if (showAllPayments) return schedule;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return schedule.slice(startIndex, endIndex);
  }, [schedule, showAllPayments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(schedule.length / itemsPerPage);

  const summaryStats = useMemo(() => {
    const totalPrincipal = schedule.reduce(
      (sum, payment) => sum + payment.principal,
      0
    );
    const totalInterest = schedule.reduce(
      (sum, payment) => sum + payment.interest,
      0
    );
    const totalPayments = schedule.reduce(
      (sum, payment) => sum + payment.payment,
      0
    );

    return {
      totalPrincipal,
      totalInterest,
      totalPayments,
      paymentCount: schedule.length,
    };
  }, [schedule]);

  if (schedule.length === 0) {
    return (
      <div className={styles.error}>
        <p>
          Unable to generate amortization schedule. Please check your debt
          details.
        </p>
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      </div>
    );
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  return (
    <div className={styles.amortizationTable}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h4>Amortization Schedule - {debt.name}</h4>
          <p>Complete payment breakdown over the life of your debt</p>
        </div>
        <Button onClick={onClose} variant="secondary" size="small">
          Close
        </Button>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>{summaryStats.paymentCount}</div>
          <div className={styles.summaryLabel}>Total Payments</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            {formatCurrency(summaryStats.totalPrincipal)}
          </div>
          <div className={styles.summaryLabel}>Total Principal</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            {formatCurrency(summaryStats.totalInterest)}
          </div>
          <div className={styles.summaryLabel}>Total Interest</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            {formatCurrency(summaryStats.totalPayments)}
          </div>
          <div className={styles.summaryLabel}>Total Paid</div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.viewToggle}>
          <Button
            onClick={() => setShowAllPayments(!showAllPayments)}
            variant="secondary"
            size="small"
          >
            {showAllPayments ? "Show Pages" : "Show All"}
          </Button>
        </div>

        {!showAllPayments && (
          <div className={styles.pagination}>
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
              size="small"
            >
              Previous
            </Button>
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="small"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Payment #</th>
              <th>Payment Amount</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Remaining Balance</th>
              <th>Principal %</th>
            </tr>
          </thead>
          <tbody>
            {displayedSchedule.map((payment) => {
              const principalPercentage =
                (payment.principal / payment.payment) * 100;

              return (
                <tr key={payment.month} className={styles.paymentRow}>
                  <td className={styles.monthCell}>
                    <span className={styles.monthNumber}>{payment.month}</span>
                    <span className={styles.monthYear}>
                      Year {Math.ceil(payment.month / 12)}
                    </span>
                  </td>
                  <td className={styles.paymentCell}>
                    {formatCurrencyPrecise(payment.payment)}
                  </td>
                  <td className={styles.principalCell}>
                    {formatCurrencyPrecise(payment.principal)}
                  </td>
                  <td className={styles.interestCell}>
                    {formatCurrencyPrecise(payment.interest)}
                  </td>
                  <td className={styles.balanceCell}>
                    {formatCurrency(payment.balance)}
                  </td>
                  <td className={styles.percentageCell}>
                    <div className={styles.percentageBar}>
                      <div
                        className={styles.percentageFill}
                        style={{ width: `${principalPercentage}%` }}
                      />
                      <span className={styles.percentageText}>
                        {principalPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!showAllPayments && totalPages > 1 && (
        <div className={styles.bottomPagination}>
          <Button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            variant="secondary"
            size="small"
          >
            First
          </Button>
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="secondary"
            size="small"
          >
            Previous
          </Button>
          <span className={styles.pageInfo}>
            {currentPage} / {totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="secondary"
            size="small"
          >
            Next
          </Button>
          <Button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            variant="secondary"
            size="small"
          >
            Last
          </Button>
        </div>
      )}
    </div>
  );
};

export default AmortizationTable;
