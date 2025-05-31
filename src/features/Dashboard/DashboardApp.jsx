import React from 'react'
import Accounts from "./Apps/Accounts"
import Assistant from './Apps/Assistant'
import Budget from './Apps/Budget'
import Debt from './Apps/Debt'
import Education from './Apps/Education'
import Goals from './Apps/Goals'
import Plan from './Apps/Plan'
import Projections from './Apps/Projections'
import Reports from './Apps/Reports'
import Settings from './Apps/Settings'

const components = {
    accounts: Accounts,
    assistant: Assistant,
    budget: Budget,
    debt: Debt,
    education: Education,
    goals: Goals,
    plan: Plan,
    projections: Projections,
    reports: Reports,
    settings: Settings
};

const DashboardApp = ({ appId, userData, closeApp }) => {
    const Component = components[appId];
    return (
        <div className="app-window glass">
            <div className="app-header">
                <span>{appId.toUpperCase()}</span>
                <button onClick={() => closeApp(appId)}>✕</button>
            </div>
            <div className="app-body">
                <Component data={userData} />
            </div>
        </div>
    );
};

export default DashboardApp;