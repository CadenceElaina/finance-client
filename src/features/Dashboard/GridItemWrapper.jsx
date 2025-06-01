// GridItemWrapper.jsx
import React, { forwardRef } from 'react';

// This component is a thin wrapper designed to be the direct child of react-grid-layout.
// It receives all the props (including style, className, event handlers, and ref)
// from react-grid-layout and applies them to its root div.
const GridItemWrapper = forwardRef(({ children, style, className, onMouseDown, onMouseUp, onTouchEnd, ...rest }, ref) => {
    return (
        <div
            ref={ref}          // Forward the ref from RGL
            style={style}      // Apply RGL's style
            className={className} // Apply RGL's className (which includes RGL's internal classes like react-grid-item, react-resizable)
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
            {...rest}          // Spread any other props from RGL (e.g., data-grid attributes)
        >
            {children} {/* This is where DashboardApp will be rendered */}
        </div>
    );
});

export default GridItemWrapper;