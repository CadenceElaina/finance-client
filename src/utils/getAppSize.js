// /src/utils/getAppSize.js

export const APP_SIZE_BREAKPOINTS = {
  SMALL_WIDTH: 800,
  SMALL_HEIGHT: 351,
  LARGE_WIDTH: 1100,
  MEDIUM_MIN_WIDTH: 801,
  MEDIUM_MIN_HEIGHT: 352,
};

export const APP_SIZE_TYPES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

// Improved logic with clearer conditions
export function getAppSize({ width, height }) {
  if (width > APP_SIZE_BREAKPOINTS.LARGE_WIDTH) {
    return APP_SIZE_TYPES.LARGE;
  }
  
  if (width <= APP_SIZE_BREAKPOINTS.SMALL_WIDTH || 
      height <= APP_SIZE_BREAKPOINTS.SMALL_HEIGHT) {
    return APP_SIZE_TYPES.SMALL;
  }
  
  return APP_SIZE_TYPES.MEDIUM;
}

// Utility functions for cleaner code
export const isSmallApp = (size) => size === APP_SIZE_TYPES.SMALL;
export const isMediumApp = (size) => size === APP_SIZE_TYPES.MEDIUM;
export const isLargeApp = (size) => size === APP_SIZE_TYPES.LARGE;

export const getAppSizeClasses = (size) => ({
  smallApp: isSmallApp(size),
  mediumApp: isMediumApp(size),
  largeApp: isLargeApp(size)
});

// Enhanced caching with size ranges instead of exact dimensions
class AppSizeCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 50; // Smaller cache for efficiency
  }

  // Round dimensions to reduce cache entries for similar sizes
  getCacheKey(width, height) {
    const roundedWidth = Math.round(width / 25) * 25; // Round to nearest 25px
    const roundedHeight = Math.round(height / 25) * 25;
    return `${roundedWidth}-${roundedHeight}`;
  }

  get(width, height) {
    const key = this.getCacheKey(width, height);
    return this.cache.get(key);
  }

  set(width, height, size) {
    const key = this.getCacheKey(width, height);
    
    // Manage cache size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, size);
    return size;
  }

  clear() {
    this.cache.clear();
  }
}

const sizeCache = new AppSizeCache();

export function getAppSizeMemoized({ width, height }) {
  // Quick validation
  if (width <= 0 || height <= 0) return APP_SIZE_TYPES.MEDIUM;
  
  const cached = sizeCache.get(width, height);
  if (cached) return cached;

  const size = getAppSize({ width, height });
  return sizeCache.set(width, height, size);
}

// Clear cache when needed
export const clearAppSizeCache = () => sizeCache.clear();

// Precompute common sizes for instant lookup
const COMMON_SIZES = [
  { w: 400, h: 300, size: APP_SIZE_TYPES.SMALL },
  { w: 600, h: 400, size: APP_SIZE_TYPES.MEDIUM },
  { w: 800, h: 600, size: APP_SIZE_TYPES.MEDIUM },
  { w: 1200, h: 800, size: APP_SIZE_TYPES.LARGE },
];

// Preload common sizes
COMMON_SIZES.forEach(({ w, h, size }) => {
  sizeCache.set(w, h, size);
});