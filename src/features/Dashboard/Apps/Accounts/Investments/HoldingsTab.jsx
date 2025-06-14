import React from 'react';
import Table from '../../../../../components/ui/Table/Table';
import Section from '../../../../../components/ui/Section/Section';
import tableStyles from '../../../../../components/ui/Table/Table.module.css';
import { DEMO_ACCOUNTS } from '../../../../../utils/constants';

const flattenHoldings = (accounts) => {
    let rows = [];
    accounts.forEach(acc => {
        if (acc.hasSecurities && Array.isArray(acc.securities)) {
            acc.securities.forEach(sec => {
                rows.push({
                    account: acc.name,
                    provider: acc.accountProvider,
                    ...sec
                });
            });
        }
    });
    return rows;
};

const HoldingsTab = () => {
    const holdings = flattenHoldings(DEMO_ACCOUNTS);

    return (
        <Section
            header={
                <div className={tableStyles.filterRow}>
                    <h3 className={tableStyles.tableHeaderTitle}>Investments</h3>
                </div>
            }
            className={tableStyles.tableSection}
        >
            <div className={tableStyles.tableContainer}>
                <Table
                    columns={[
                        { key: 'account', label: 'Account' },
                        { key: 'provider', label: 'Institution' },
                        { key: 'name', label: 'Security' },
                        { key: 'ticker', label: 'Ticker' },
                        { key: 'quantity', label: 'Qty' },
                        { key: 'value', label: 'Current Value', render: v => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                        { key: 'purchasePrice', label: 'Purchase Price', render: v => v ? `$${v}` : '-' },
                        { key: 'datePurchased', label: 'Purchased', render: v => v ? new Date(v).toLocaleDateString() : '-' }
                    ]}
                    data={holdings}
                    className={tableStyles.compactTable}
                />
            </div>
        </Section>
    );
};

export default HoldingsTab;