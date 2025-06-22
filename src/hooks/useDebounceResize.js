import { useState, useEffect, useRef } from 'react';
import { debounce } from '../utils/debounce';

export const useDebounceResize = (delay = 150) => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const debouncedSetSize = debounce((width, height) => {
      setContainerSize({ width, height });
    }, delay);

    const setInitialSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        debouncedSetSize(rect.width, rect.height);
      }
    };

    setInitialSize();

    const resizeObserver = new window.ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          debouncedSetSize(width, height);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [delay]);

  return { containerRef, containerSize };
};