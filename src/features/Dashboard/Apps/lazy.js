// src/features/Dashboard/Apps/lazy.js - NEW
import { lazy } from 'react';

// Heavy components that should be lazy loaded
export const LazyAccounts = lazy(() => import('./Accounts/Accounts'));
export const LazyBudget = lazy(() => import('./Budget/Budget'));
export const LazyGoals = lazy(() => import('./Goals/Goals'));
export const LazyPlan = lazy(() => import('./Plan/Plan'));

// Lightweight components - keep as regular imports for instant loading
export { default as Assistant } from './Assistant';
export { default as Debt } from './Debt';
export { default as Education } from './Education';
export { default as Settings } from './Settings';

// Preload function for better UX
export const preloadApps = () => {
  // Preload heavy components on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('./Accounts/Accounts');
      import('./Budget/Budget');
      import('./Goals/Goals');
      import('./Plan/Plan');
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      import('./Accounts/Accounts');
      import('./Budget/Budget');
      import('./Goals/Goals');
      import('./Plan/Plan');
    }, 1000);
  }
};

// src/features/Dashboard/DashboardApp.jsx - OPTIMIZED
import React, { Suspense } from "react";
import { LazyAccounts, LazyBudget, LazyGoals, LazyPlan } from "./Apps/lazy";

const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px',
    color: 'var(--text-secondary)'
  }}>
    Loading...
  </div>
);

const components = {
  accounts: LazyAccounts,
  budget: LazyBudget,
  goals: LazyGoals,
  plan: LazyPlan,
  // Keep lightweight components as regular imports
  assistant: () => import('./Apps/Assistant'),
  debt: () => import('./Apps/Debt'),
  education: () => import('./Apps/Education'),
  settings: () => import('./Apps/Settings'),
};

const DashboardApp = ({ appId, userData, closeApp, isSelected }) => {
  const Component = components[appId];
  
  return (
    <div className={`app-window glass${isSelected ? " selected" : ""}`}>
      <div className="app-header">
        <span>{appId.toUpperCase()}</span>
        <button onClick={(e) => { e.stopPropagation(); closeApp(appId); }} className="no-drag">
          ✕
        </button>
      </div>
      <div className="app-body">
        {Component ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Component data={userData} />
          </Suspense>
        ) : (
          <div>App not found</div>
        )}
      </div>
    </div>
  );
};

export default DashboardApp;