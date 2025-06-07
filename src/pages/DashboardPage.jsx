import React, { useState, useEffect, useRef } from 'react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../styles/global.css';
import '../features/Dashboard/dashboard.css'
import '../features/Dashboard/AppMenu/apporblauncher.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { demoUser } from '../data/demoData';
import { useAuth } from '../contexts/AuthContext';
import DashboardApp from '../features/Dashboard/DashboardApp';
import GridItemWrapper from '../features/Dashboard/GridItemWrapper';
import AppOrbLauncher from '../features/Dashboard/AppMenu/AppOrbLauncher';

const ResponsiveGridLayout = WidthProvider(Responsive);

const appsList = [
  { id: 'accounts', name: 'My Accounts' },
  { id: 'budget', name: 'Budget' },
  { id: 'plan', name: 'Plan' },
  { id: 'reports', name: 'Reports' },
  { id: 'debt', name: 'Debt' },
  { id: 'education', name: 'Education Center' },
  { id: 'projections', name: 'Projections' },
  { id: 'settings', name: 'Settings' },
];

const DashboardPage = ({ userData = demoUser }) => {
  const DEFAULT_APP_WIDTH = 6;  // was 6
  const DEFAULT_APP_HEIGHT = 7.5; // was 8
  const availableHandles = ['se'];
  const initialAppIds = ['budget', 'accounts', 'plan', 'reports'];

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
        minH: 4,
        resizeHandles: availableHandles
      });
    });

    return layout;
  };

  const [layouts, setLayouts] = useState(() => ({
    lg: generateInitialLayout(initialAppIds, 12, DEFAULT_APP_WIDTH, DEFAULT_APP_HEIGHT)
  }));
  const [openAppIds, setOpenAppIds] = useState([...initialAppIds]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const appRefs = useRef({});

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
          minW: 2,
          minH: 2,
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

  //Handle keyboard shortcuts for app management
  // Ctrl + Shift + 1: Open all apps
  // Ctrl + Shift + 2: Close all apps
  // Ctrl + Shift + 3: Maximize selected app
  // Ctrl + Shift + 4: Close selected app
  // Arrow keys: Navigate through open apps
  // ArrowRight: Cycle to next app
  // ArrowLeft: Cycle to previous app
  // ArrowUp: Jump to first app
  // ArrowDown: Jump to last app
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey) {
        if (e.code === 'Digit1') {
          setOpenAppIds(appsList.map(app => app.id)); // Open all
        }
        if (e.code === 'Digit2') {
          setOpenAppIds([]); // Close all
        }
        if (e.code === 'Digit3' && selectedAppId) {
          setLayouts(prev => {
            const newLayouts = { ...prev };
            for (const bp in newLayouts) {
              // Find the maximized app and others
              const maximized = newLayouts[bp].find(item => item.i === selectedAppId);
              const others = newLayouts[bp].filter(item => item.i !== selectedAppId);

              // Sort others by their current y/x order
              others.sort((a, b) => a.y - b.y || a.x - b.x);

              // Set maximized app to y:0, x:0, w:12, h:12
              const newMaximized = { ...maximized, x: 0, y: 0, w: 12, h: 12 };

              // Reassign y for others starting from 1
              const newOthers = others.map((item, idx) => ({
                ...item,
                y: idx + 1
              }));

              // Compose new layout: maximized first, then others
              newLayouts[bp] = [newMaximized, ...newOthers];
            }
            return newLayouts;
          });
        }
        if (e.code === 'Digit4' && selectedAppId) {
          closeApp(selectedAppId);
        }

        // Cycle to next app
        const visualOrder = getVisualOrder(openAppIds, layouts);

        if (e.code === 'ArrowRight' && visualOrder.length > 0) {
          e.preventDefault();
          if (!selectedAppId) {
            setSelectedAppId(visualOrder[0]);
          } else {
            const idx = visualOrder.indexOf(selectedAppId);
            setSelectedAppId(visualOrder[(idx + 1) % visualOrder.length]);
          }
        }
        // Cycle to previous app
        if (e.code === 'ArrowLeft' && visualOrder.length > 0) {
          e.preventDefault();
          if (!selectedAppId) {
            setSelectedAppId(visualOrder[visualOrder.length - 1]);
          } else {
            const idx = visualOrder.indexOf(selectedAppId);
            setSelectedAppId(visualOrder[(idx - 1 + visualOrder.length) % visualOrder.length]);
          }
        }
        // Jump to first app
        if (e.code === 'ArrowUp' && visualOrder.length > 0) {
          e.preventDefault();
          setSelectedAppId(visualOrder[0]);
        }
        // Jump to last app
        if (e.code === 'ArrowDown' && visualOrder.length > 0) {
          e.preventDefault();
          setSelectedAppId(visualOrder[visualOrder.length - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAppId, openAppIds, layouts, closeApp, setOpenAppIds, setLayouts]);

  // Scroll to selected app when it changes
  useEffect(() => {
    // Find the selected app by its class
    const selectedEl = document.querySelector('.app-window.selected');
    if (selectedEl) {
      selectedEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [selectedAppId]);

  function getVisualOrder(openAppIds, layouts) {
    const layout = layouts.lg || [];
    // Only include open apps, sort by y then x
    return layout
      .filter(item => openAppIds.includes(item.i))
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map(item => item.i);
  }

  return (
    <>
      <div className="dashboard-container">

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
          draggableCancel=".no-drag"
          resizeHandles={['se']}
        >
          {openAppIds.map(appId => {
            const isSelected = selectedAppId === appId;
            return (
              <GridItemWrapper
                key={appId}
                onClick={() => setSelectedAppId(appId)}
                ref={el => { appRefs.current[appId] = el; }}
              >
                <DashboardApp
                  appId={appId}
                  userData={userData}
                  closeApp={closeApp}
                  isSelected={isSelected}
                />
              </GridItemWrapper>
            );
          })}
        </ResponsiveGridLayout>

      </div>
      <AppOrbLauncher
        appsList={appsList}
        openApp={openApp}
        openAppIds={openAppIds}
      />
    </>
  );
};
export default DashboardPage;