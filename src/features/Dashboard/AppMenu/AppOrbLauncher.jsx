// AppOrbLauncher.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Draggable from "react-draggable";
import ReactDOM from "react-dom"; // Fixed: Use react-dom instead of react-portal
import { throttle } from "../../../utils/debounce";
import "./apporblauncher.css";

const MENU_SIZE = 195;
const ORB_SIZE = 50;
const PADDING = 60;

const AppOrbLauncher = React.memo(({ appsList, openApp, openAppIds }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const nodeRef = useRef(null);
  const closeTimeout = useRef(null);
  const hasInitialized = useRef(false);

  // Memoize app positions to prevent recalculation
  const appPositions = useMemo(() => {
    const totalApps = appsList.length;
    const angleIncrement = 360 / totalApps;
    const radius = 115;

    return appsList.map((app, index) => {
      const angle = index * angleIncrement;
      const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
      const y = radius * Math.sin((angle - 90) * (Math.PI / 180));
      return { ...app, x, y };
    });
  }, [appsList]);

  // Throttled bounds calculation
  const calculateBounds = useCallback(
    throttle(() => {
      const pageWidth = document.documentElement.scrollWidth;
      const pageHeight = document.documentElement.scrollHeight;
      const min = PADDING + MENU_SIZE / 2 - ORB_SIZE / 2;
      const maxX = pageWidth - (MENU_SIZE / 2 + ORB_SIZE / 2 + PADDING);
      const maxY = pageHeight - (MENU_SIZE / 2 + ORB_SIZE / 2 + PADDING);

      const newBounds = { left: min, top: min, right: maxX, bottom: maxY };
      setBounds(newBounds);

      // Clamp current position to new bounds
      setPosition((pos) => ({
        x: Math.min(Math.max(pos.x, min), maxX),
        y: Math.min(Math.max(pos.y, min), maxY),
      }));
    }, 100),
    []
  );

  // Initialize position once
  useEffect(() => {
    if (!hasInitialized.current) {
      const pageWidth = document.documentElement.scrollWidth;
      const pageHeight = document.documentElement.scrollHeight;
      const min = PADDING + MENU_SIZE / 2 - ORB_SIZE / 2;
      const maxX = pageWidth - (MENU_SIZE / 2 + ORB_SIZE / 2 + PADDING);
      const maxY = pageHeight - (MENU_SIZE / 2 + ORB_SIZE / 2 + PADDING);

      setPosition({ x: maxX, y: maxY });
      setBounds({ left: min, top: min, right: maxX, bottom: maxY });
      hasInitialized.current = true;
    }
  }, []);

  // Listen for resize events
  useEffect(() => {
    calculateBounds();
    window.addEventListener("resize", calculateBounds);
    return () => {
      window.removeEventListener("resize", calculateBounds);
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
      }
    };
  }, [calculateBounds]);

  // Auto-close functionality
  const handleMouseEnter = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsClosing(true);
    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 1000); // 1 second delay before closing
  }, []);

  const handleAppClick = useCallback(
    (appId) => {
      openApp(appId);
      setIsOpen(false);
      setIsClosing(false);
    },
    [openApp]
  );

  const handleOrbClick = useCallback((e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev); // Toggle instead of just opening
  }, []);

  const handleDragStop = useCallback(
    (_, data) => {
      const min = bounds.left;
      const maxX = bounds.right;
      const maxY = bounds.bottom;
      setPosition({
        x: Math.min(Math.max(data.x, min), maxX),
        y: Math.min(Math.max(data.y, min), maxY),
      });
    },
    [bounds]
  );

  // Memoize the orb icon
  const orbIcon = useMemo(() => {
    if (isClosing) return "−";
    return isOpen ? "−" : "＋";
  }, [isOpen, isClosing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return ReactDOM.createPortal(
    <Draggable
      nodeRef={nodeRef}
      position={position}
      bounds={bounds}
      onStop={handleDragStop}
      handle=".app-orb"
    >
      <div className="app-orb-launcher-container" ref={nodeRef}>
        <div
          className={`app-orb${isOpen ? " active" : ""}`}
          onClick={handleOrbClick}
        >
          <span className="orb-icon">{orbIcon}</span>
        </div>
        {isOpen && (
          <div className="app-orb-menu">
            {appPositions.map((app) => {
              const isActive = openAppIds.includes(app.id);
              return (
                <button
                  key={app.id}
                  className={`app-orb-item${isActive ? " active" : ""}`}
                  style={{
                    transform: `translate(${app.x}px, ${app.y}px)`,
                    willChange: "transform", // Optimize for animations
                  }}
                  onClick={() => handleAppClick(app.id)}
                >
                  <span className="app-orb-item-icon">
                    {app.name.charAt(0)}
                  </span>
                  <span className="app-orb-item-label">{app.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Draggable>,
    document.body
  );
});

AppOrbLauncher.displayName = "AppOrbLauncher";

export default AppOrbLauncher;
