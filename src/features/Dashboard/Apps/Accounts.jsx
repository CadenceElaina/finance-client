import React, { useState, useMemo } from 'react';
import FlexibleTabs from '../../../components/ui/Tabs/FlexibleTabs';
import Table from '../../../components/ui/Table/Table';
import { DEMO_ACCOUNTS } from '../../../utils/constants';

// Utility: group accounts by a key
const groupBy = (arr, keyFn) => {
    return arr.reduce((acc, item) => {
        const key = keyFn(item);
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
    }, {});
};

// Net worth calculation
const getNetWorth = (accounts) =>
    accounts.reduce((sum, acc) => sum + (typeof acc.value === 'number' ? acc.value : 0), 0);

// --- Overview Tab ---
const OverviewTab = ({ accounts }) => {
    const [groupByType, setGroupByType] = useState('institution');
    const groupOptions = [
        { value: 'institution', label: 'By Financial Institution' },
        { value: 'type', label: 'By Account Type' },
        { value: 'group', label: 'By Custom Group/Label' },
    ];

    const netWorth = getNetWorth(accounts);

    return (
        <div className="accounts-overview-tab">
            <div className="accounts-overview-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3>
                    Net Worth: <span className={netWorth >= 0 ? 'positive' : 'negative'}>
                        ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </h3>
                <div>
                    <label htmlFor="groupByType" style={{ marginRight: 8 }}>Group By:</label>
                    <select id="groupByType" value={groupByType} onChange={e => setGroupByType(e.target.value)}>
                        {groupOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <Table
                columns={[
                    { key: 'name', label: 'Account' },
                    { key: 'type', label: 'Type' },
                    { key: 'accountProvider', label: 'Institution' },
                    {
                        key: 'value', label: 'Value', render: val =>
                            <span className={val >= 0 ? 'positive' : 'negative'}>
                                ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                    }
                ]}
                data={accounts}
            />
        </div>
    );
};

// --- Assets Tab ---
const AssetsTab = ({ accounts }) => {
    const [filter, setFilter] = useState({ institution: '', category: '', group: '' });

    // Filter only positive-value accounts (assets)
    const filtered = useMemo(() => {
        return accounts.filter(acc =>
            acc.value > 0 &&
            (!filter.institution || acc.accountProvider === filter.institution) &&
            (!filter.category || acc.type === filter.category) &&
            (!filter.group || acc.group === filter.group)
        );
    }, [accounts, filter]);

    // Unique filter options
    const institutions = [...new Set(accounts.map(a => a.accountProvider).filter(Boolean))];
    const categories = [...new Set(accounts.map(a => a.type).filter(Boolean))];
    const groups = [...new Set(accounts.map(a => a.group).filter(Boolean))];

    return (
        <div className="accounts-assets-tab">
            <div className="accounts-filters">
                <select value={filter.institution} onChange={e => setFilter(f => ({ ...f, institution: e.target.value }))}>
                    <option value="">All Institutions</option>
                    {institutions.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filter.group} onChange={e => setFilter(f => ({ ...f, group: e.target.value }))}>
                    <option value="">All Groups</option>
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <Table
                columns={[
                    { key: 'name', label: 'Account' },
                    { key: 'type', label: 'Type' },
                    { key: 'accountProvider', label: 'Institution' },
                    {
                        key: 'value', label: 'Value', render: val =>
                            <span className="positive">
                                ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                    },
                    { key: 'currency', label: 'Currency' }
                ]}
                data={filtered}
            />
        </div>
    );
};

// --- Liabilities Tab ---
const LiabilitiesTab = ({ accounts }) => {
    const [filter, setFilter] = useState({ institution: '', type: '', group: '' });

    // Filter only negative-value accounts (liabilities)
    const filtered = useMemo(() => {
        return accounts.filter(acc =>
            acc.value < 0 &&
            (!filter.institution || acc.accountProvider === filter.institution) &&
            (!filter.type || acc.type === filter.type) &&
            (!filter.group || acc.group === filter.group)
        );
    }, [accounts, filter]);

    // Unique filter options
    const institutions = [...new Set(accounts.map(a => a.accountProvider).filter(Boolean))];
    const types = [...new Set(accounts.map(a => a.type).filter(Boolean))];
    const groups = [...new Set(accounts.map(a => a.group).filter(Boolean))];

    return (
        <div className="accounts-liabilities-tab">
            <div className="accounts-filters">
                <select value={filter.institution} onChange={e => setFilter(f => ({ ...f, institution: e.target.value }))}>
                    <option value="">All Institutions</option>
                    {institutions.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
                    <option value="">All Types</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filter.group} onChange={e => setFilter(f => ({ ...f, group: e.target.value }))}>
                    <option value="">All Groups</option>
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <Table
                columns={[
                    { key: 'name', label: 'Account' },
                    { key: 'type', label: 'Type' },
                    { key: 'accountProvider', label: 'Institution' },
                    {
                        key: 'value', label: 'Balance', render: val =>
                            <span className="negative">
                                ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                    },
                    { key: 'currency', label: 'Currency' }
                ]}
                data={filtered}
            />
        </div>
    );
};

// --- Transactions Tab ---
const TransactionsTab = ({ accounts }) => {
    // For demo, only show transactions (not investments/portfolio)
    // We'll assume each account has a `transactions` array (not securities)
    const transactions = useMemo(() => {
        let txs = [];
        accounts.forEach(acc => {
            if (Array.isArray(acc.transactions)) {
                acc.transactions.forEach(tx => {
                    txs.push({
                        account: acc.name,
                        institution: acc.accountProvider,
                        type: acc.type,
                        ...tx
                    });
                });
            }
        });
        return txs;
    }, [accounts]);

    const [filter, setFilter] = useState({ account: '', institution: '', type: '' });

    const filtered = useMemo(() => {
        return transactions.filter(tx =>
            (!filter.account || tx.account === filter.account) &&
            (!filter.institution || tx.institution === filter.institution) &&
            (!filter.type || tx.type === filter.type)
        );
    }, [transactions, filter]);

    // Unique filter options
    const accountsList = [...new Set(transactions.map(t => t.account))];
    const institutions = [...new Set(transactions.map(t => t.institution))];
    const types = [...new Set(transactions.map(t => t.type))];

    return (
        <div className="accounts-transactions-tab">
            <div className="accounts-filters">
                <select value={filter.account} onChange={e => setFilter(f => ({ ...f, account: e.target.value }))}>
                    <option value="">All Accounts</option>
                    {accountsList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filter.institution} onChange={e => setFilter(f => ({ ...f, institution: e.target.value }))}>
                    <option value="">All Institutions</option>
                    {institutions.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
                    <option value="">All Types</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <Table
                columns={[
                    { key: 'account', label: 'Account' },
                    { key: 'institution', label: 'Institution' },
                    { key: 'type', label: 'Type' },
                    { key: 'date', label: 'Date' },
                    { key: 'description', label: 'Description' },
                    {
                        key: 'amount', label: 'Amount', render: val =>
                            <span className={val >= 0 ? 'positive' : 'negative'}>
                                ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                    },
                    { key: 'currency', label: 'Currency' }
                ]}
                data={filtered}
            />
        </div>
    );
};

// --- Investments Tab ---
const InvestmentsTab = ({ accounts }) => {
    // Only show accounts with securities (investments)
    const portfolios = accounts.filter(acc => Array.isArray(acc.securities) && acc.securities.length > 0);

    // Portfolio selection
    const [selectedPortfolioId, setSelectedPortfolioId] = useState(portfolios[0]?.id || '');

    const selectedPortfolio = portfolios.find(acc => acc.id === selectedPortfolioId) || portfolios[0];

    // Inner tabs: Holdings Allocation, Performance
    const [activeInnerTab, setActiveInnerTab] = useState('holdings');

    // Holdings Table Data
    const holdings = selectedPortfolio?.securities || [];

    // Portfolio performance: for now, just show current value vs. purchase cost
    const totalCurrentValue = holdings.reduce((sum, sec) => sum + (sec.value || 0), 0);
    const totalPurchaseCost = holdings.reduce((sum, sec) => sum + ((sec.purchasePrice || 0) * (sec.quantity || 0)), 0);
    const totalGain = totalCurrentValue - totalPurchaseCost;
    const totalGainPct = totalPurchaseCost > 0 ? (totalGain / totalPurchaseCost) * 100 : 0;

    // Combined performance for all portfolios
    const allHoldings = portfolios.flatMap(acc => acc.securities || []);
    const allCurrentValue = allHoldings.reduce((sum, sec) => sum + (sec.value || 0), 0);
    const allPurchaseCost = allHoldings.reduce((sum, sec) => sum + ((sec.purchasePrice || 0) * (sec.quantity || 0)), 0);
    const allGain = allCurrentValue - allPurchaseCost;
    const allGainPct = allPurchaseCost > 0 ? (allGain / allPurchaseCost) * 100 : 0;

    // Portfolio selector
    return (
        <div className="accounts-investments-tab">
            <div className="accounts-investments-header">
                <label htmlFor="portfolio-select">Portfolio:</label>
                <select
                    id="portfolio-select"
                    value={selectedPortfolioId}
                    onChange={e => setSelectedPortfolioId(e.target.value)}
                >
                    {portfolios.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
                <div className="accounts-investments-inner-tabs">
                    <button
                        className={activeInnerTab === 'holdings' ? 'active' : ''}
                        onClick={() => setActiveInnerTab('holdings')}
                    >
                        Holdings Allocation
                    </button>
                    <button
                        className={activeInnerTab === 'performance' ? 'active' : ''}
                        onClick={() => setActiveInnerTab('performance')}
                    >
                        Performance
                    </button>
                </div>
            </div>
            {activeInnerTab === 'holdings' && (
                <div className="accounts-investments-holdings">
                    <Table
                        columns={[
                            { key: 'name', label: 'Security' },
                            { key: 'ticker', label: 'Ticker' },
                            { key: 'quantity', label: 'Qty' },
                            { key: 'purchasePrice', label: 'Purchase Price', render: val => val ? `$${val}` : '-' },
                            { key: 'value', label: 'Current Value', render: val => val ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-' },
                            {
                                key: 'gain', label: 'Gain/Loss', render: (val, row) => {
                                    const cost = (row.purchasePrice || 0) * (row.quantity || 0);
                                    const gain = (row.value || 0) - cost;
                                    const pct = cost > 0 ? (gain / cost) * 100 : 0;
                                    return (
                                        <span className={gain >= 0 ? 'positive' : 'negative'}>
                                            {gain >= 0 ? '+' : ''}${gain.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({pct.toFixed(2)}%)
                                        </span>
                                    );
                                }
                            },
                            { key: 'datePurchased', label: 'Date Purchased' }
                        ]}
                        data={holdings}
                    />
                    <div className="accounts-investments-summary">
                        <strong>Portfolio Total:</strong>
                        <span>Current Value: ${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span>Purchase Cost: ${totalPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span>
                            Gain/Loss: <span className={totalGain >= 0 ? 'positive' : 'negative'}>
                                {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({totalGainPct.toFixed(2)}%)
                            </span>
                        </span>
                    </div>
                </div>
            )}
            {activeInnerTab === 'performance' && (
                <div className="accounts-investments-performance">
                    {/* Placeholder for future line chart */}
                    <div style={{ margin: '2rem 0', textAlign: 'center', color: '#888' }}>
                        [Performance chart coming soon]
                    </div>
                    <div className="accounts-investments-summary">
                        <strong>Portfolio Performance:</strong>
                        <span>Current Value: ${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span>Purchase Cost: ${totalPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span>
                            Gain/Loss: <span className={totalGain >= 0 ? 'positive' : 'negative'}>
                                {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({totalGainPct.toFixed(2)}%)
                            </span>
                        </span>
                    </div>
                    <div className="accounts-investments-summary">
                        <strong>All Portfolios Combined:</strong>
                        <span>Current Value: ${allCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span>Purchase Cost: ${allPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span>
                            Gain/Loss: <span className={allGain >= 0 ? 'positive' : 'negative'}>
                                {allGain >= 0 ? '+' : ''}${allGain.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({allGainPct.toFixed(2)}%)
                            </span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

const Accounts = () => {
    // In a real app, fetch accounts from context or API
    const accounts = DEMO_ACCOUNTS;

    const tabs = [
        { id: 'overview', label: 'Overview', component: () => <OverviewTab accounts={accounts} /> },
        { id: 'assets', label: 'Assets', component: () => <AssetsTab accounts={accounts} /> },
        { id: 'liabilities', label: 'Liabilities', component: () => <LiabilitiesTab accounts={accounts} /> },
        { id: 'transactions', label: 'Transactions', component: () => <TransactionsTab accounts={accounts} /> },
        { id: 'investments', label: 'Investments', component: () => <InvestmentsTab accounts={accounts} /> },
    ];

    return (
        <div className="accounts-app">
            <FlexibleTabs tabs={tabs} initialTabId="overview" />
        </div>
    );
};

export default Accounts;