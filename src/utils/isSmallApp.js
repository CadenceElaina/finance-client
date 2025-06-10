// src/utils/isSmallApp.js
export const SMALL_APP_WIDTH_BREAKPOINT = 800;
export const SMALL_APP_HEIGHT_BREAKPOINT = 351;

export function isSmallApp(size) {
    if (size.width > 0 && size.width <= SMALL_APP_WIDTH_BREAKPOINT) {
        return true;
    }
    if (size.width > SMALL_APP_WIDTH_BREAKPOINT && size.height > 0 && size.height <= SMALL_APP_HEIGHT_BREAKPOINT) {
        return true;
    }
    return false;
}