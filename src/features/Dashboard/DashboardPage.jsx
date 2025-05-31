import React, { useState } from 'react';
import "./dashboard.css"
import { demoUser } from '../Demo/demoData';
import DashboardApp from './DashboardApp';

const appsList = [
  { id: 'budget', name: 'Budget' },
  { id: 'plan', name: 'Plan' },
  { id: 'reports', name: 'Reports' },
  { id: 'accounts', name: 'My Accounts' },
  { id: 'debt', name: 'Debt' },
  { id: 'education', name: 'Education Center' },
  { id: 'projections', name: 'Projections' },
  { id: 'settings', name: 'Settings' },
];

const DashboardPage = ({ userData = demoUser }) => {
  const [openApps, setOpenApps] = useState(['budget', 'plan', 'reports']);

  const closeApp = (id) => {
    setOpenApps(openApps.filter(app => app !== id));
  };

  const openApp = (id) => {
    if (!openApps.includes(id)) {
      setOpenApps([...openApps, id]);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="app-launcher">
        {appsList.map(app => (
          <button key={app.id} onClick={() => openApp(app.id)}>
            {app.name}
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        {openApps.map(appId => (
          <DashboardApp key={appId} appId={appId} userData={userData} closeApp={closeApp} />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;