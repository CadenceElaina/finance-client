import React from "react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import Accounts from "./Apps/Accounts/Accounts";
import Assistant from "./Apps/Assistant";
import Budget from "./Apps/Budget/Budget";
import Debt from "./Apps/Debt";
import Education from "./Apps/Education";
import Goals from "./Apps/Goals/Goals"; // Updated import
import Plan from "./Apps/Plan/Plan";
import Settings from "./Apps/Settings";

const components = {
  accounts: Accounts,
  assistant: Assistant,
  budget: Budget,
  debt: Debt,
  education: Education,
  goals: Goals,
  plan: Plan,
  settings: Settings,
};

const DashboardApp = ({ appId, userData, closeApp, isSelected }) => {
  const Component = components[appId];
  return (
    <div className={`app-window glass${isSelected ? " selected" : ""}`}>
      <div className="app-header">
        <span>{appId.toUpperCase()}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeApp(appId);
          }}
          className="no-drag"
        >
          ✕
        </button>
      </div>
      <div className="app-body">
        {Component ? <Component data={userData} /> : <div>App not found</div>}
      </div>
    </div>
  );
};

export default DashboardApp;
