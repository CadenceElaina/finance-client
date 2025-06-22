// src/contexts/AppSizeContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { throttle } from "../utils/debounce";
import { getAppSizeMemoized } from "../utils/getAppSize";

const AppSizeContext = createContext();

export const AppSizeProvider = ({ children }) => {
  const [appSizes, setAppSizes] = useState(new Map());
  const observersRef = useRef(new Map());
  const elementsRef = useRef(new Map());
  const lastSizeRef = useRef(new Map()); // Track last known sizes

  // Use throttle instead of debounce for more responsive updates
  const throttledUpdate = useRef(
    throttle((updates) => {
      setAppSizes((prev) => {
        const newSizes = new Map(prev);
        let hasChanges = false;

        updates.forEach(({ appId, size }) => {
          const lastSize = lastSizeRef.current.get(appId);
          if (lastSize !== size) {
            newSizes.set(appId, size);
            lastSizeRef.current.set(appId, size);
            hasChanges = true;
          }
        });

        return hasChanges ? newSizes : prev;
      });
    }, 50) // Faster throttle for more responsive sizing
  );

  const registerApp = useCallback((appId, element) => {
    if (!element || !appId) return;

    // Clean up existing observer if any
    unregisterApp(appId);

    // Batch multiple resize events that happen in quick succession
    let resizeTimeout;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;

          // Only process if size actually changed significantly
          const lastSize = lastSizeRef.current.get(appId);
          const newSize = getAppSizeMemoized({ width, height });

          if (lastSize !== newSize) {
            throttledUpdate.current([{ appId, size: newSize }]);
          }
        }
      }, 16); // ~60fps batching
    });

    observer.observe(element);
    observersRef.current.set(appId, observer);
    elementsRef.current.set(appId, element);

    // Set initial size synchronously
    const rect = element.getBoundingClientRect();
    const initialSize = getAppSizeMemoized({
      width: rect.width,
      height: rect.height,
    });

    setAppSizes((prev) => new Map(prev).set(appId, initialSize));
    lastSizeRef.current.set(appId, initialSize);

    return () => unregisterApp(appId);
  }, []);

  const unregisterApp = useCallback((appId) => {
    const observer = observersRef.current.get(appId);
    if (observer) {
      observer.disconnect();
      observersRef.current.delete(appId);
    }

    elementsRef.current.delete(appId);
    lastSizeRef.current.delete(appId);

    setAppSizes((prev) => {
      if (prev.has(appId)) {
        const newSizes = new Map(prev);
        newSizes.delete(appId);
        return newSizes;
      }
      return prev;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observersRef.current.forEach((observer) => observer.disconnect());
      observersRef.current.clear();
      elementsRef.current.clear();
      lastSizeRef.current.clear();
    };
  }, []);

  const contextValue = {
    appSizes,
    registerApp,
    unregisterApp,
  };

  return (
    <AppSizeContext.Provider value={contextValue}>
      {children}
    </AppSizeContext.Provider>
  );
};

export const useAppSize = (appId) => {
  const context = useContext(AppSizeContext);
  if (!context) {
    throw new Error("useAppSize must be used within AppSizeProvider");
  }

  return context.appSizes.get(appId) || "medium";
};

export const useAppSizeRegistration = () => {
  const context = useContext(AppSizeContext);
  if (!context) {
    throw new Error(
      "useAppSizeRegistration must be used within AppSizeProvider"
    );
  }

  return context;
};
