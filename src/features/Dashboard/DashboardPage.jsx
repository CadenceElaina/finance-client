import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';

import { demoUser } from '../Demo/demoData';
import DashboardApp from './DashboardApp';
import GridItemWrapper from './GridItemWrapper';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './dashboard.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

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
  const DEFAULT_APP_WIDTH = 6;
  const DEFAULT_APP_HEIGHT = 6;

  const availableHandles = ['se'];

  const initialAppIds = ['budget', 'accounts', 'reports', 'plan'];

  const generateInitialLayout = (ids, cols, defaultWidth, defaultHeight) => {
    const layout = [];
    const numApps = ids.length;
    const appsPerRow = cols / defaultWidth;

    ids.forEach((id, index) => {
      const x = (index % appsPerRow) * defaultWidth;
      const y = Math.floor(index / appsPerRow) * defaultHeight;
      layout.push({
        i: id,
        x: x,
        y: y,
        w: defaultWidth,
        h: defaultHeight,
        minW: 4,
        minH: 3,
        resizeHandles: availableHandles
      });
    });

    return layout;
  };

  const [layouts, setLayouts] = useState(() => ({
    lg: generateInitialLayout(initialAppIds, 12, DEFAULT_APP_WIDTH, DEFAULT_APP_HEIGHT)
  }));
  const [openAppIds, setOpenAppIds] = useState([...initialAppIds]);

  const closeApp = (id) => {
    setOpenAppIds(prevIds => prevIds.filter(appId => appId !== id));
    setLayouts(prevLayouts => {
      const newLayouts = {};
      for (const breakpoint in prevLayouts) {
        newLayouts[breakpoint] = prevLayouts[breakpoint].filter(item => item.i !== id);
      }
      return newLayouts;
    });
  };

  const openApp = (id) => {
    if (!openAppIds.includes(id)) {
      setOpenAppIds(prevIds => [...prevIds, id]);

      setLayouts(prevLayouts => {
        const newLayouts = { ...prevLayouts };

        const newAppLayout = {
          i: id,
          x: 0,
          y: Infinity,
          w: DEFAULT_APP_WIDTH,
          h: DEFAULT_APP_HEIGHT,
          minW: 4,
          minH: 3,
          resizeHandles: availableHandles
        };

        if (newLayouts.lg) {
          newLayouts.lg = [...newLayouts.lg, newAppLayout];
        } else {
          newLayouts.lg = [newAppLayout];
        }
        return newLayouts;
      });
    }
  };

  const onLayoutChange = (currentLayout, allLayouts) => {
    setLayouts(allLayouts);
  };

  return (
    <div className="dashboard-container">
      <div className="app-launcher">
        {appsList.map(app => (
          <button
            key={app.id}
            onClick={() => openApp(app.id)}
            className={openAppIds.includes(app.id) ? 'active' : ''}
          >
            {app.name}
          </button>
        ))}
      </div>

      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        containerPadding={[0, 0]}
        margin={[10, 10]}
        rowHeight={50}
        isResizable={true}
        onLayoutChange={onLayoutChange}
        draggableHandle=".app-header"
        resizeHandles={['se']}
      >
        {openAppIds.map(appId => {

          return (
            // Wrap DashboardApp in GridItemWrapper
            <GridItemWrapper key={appId}>
              <DashboardApp appId={appId} userData={userData} closeApp={closeApp} />
            </GridItemWrapper>
          );

        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardPage;