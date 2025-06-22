import { useEffect, useRef, useState } from 'react';
import { useAppSizeRegistration } from '../contexts/AppSizeContext';

export const useAppSizeRef = (appId) => {
  const containerRef = useRef(null);
  const { registerApp, unregisterApp } = useAppSizeRegistration();
  const cleanupRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  // Use Intersection Observer to pause size tracking when app is not visible
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { 
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '50px' // Start tracking 50px before entering viewport
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Only register size tracking when visible
    if (containerRef.current && appId && isVisible) {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      
      cleanupRef.current = registerApp(appId, containerRef.current);
    } else if (!isVisible && cleanupRef.current) {
      // Pause tracking when not visible
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [appId, registerApp, isVisible]);

  // Additional cleanup on appId change
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [appId]);

  return containerRef;
};