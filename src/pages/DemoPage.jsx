import React, { useEffect } from 'react';
import DashboardPage from './DashboardPage';
import { useBudget } from '../contexts/BudgetContext';
import { clearBudgetDataFromLocal } from '../utils/localStorageUtils';

const DemoPage = () => {
    const { resetBudget } = useBudget();

    useEffect(() => {
        clearBudgetDataFromLocal();
        resetBudget();
    }, [resetBudget]);

    return <DashboardPage />;
};

export default DemoPage;