// /src/utils/getAppSize.js

export const SMALL_APP_WIDTH = 800;
export const SMALL_APP_HEIGHT = 351;
export const LARGE_APP_WIDTH = 1100;

export function getAppSize({ width, height }) {
    if (width > LARGE_APP_WIDTH) return 'large';
    if (
        (width > 0 && width <= SMALL_APP_WIDTH) ||
        (width > SMALL_APP_WIDTH && height > 0 && height <= SMALL_APP_HEIGHT)
    ) {
        return 'small';
    }
    return 'medium';
}