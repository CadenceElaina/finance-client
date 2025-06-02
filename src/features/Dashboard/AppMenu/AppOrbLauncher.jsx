// AppOrbLauncher.jsx
import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import ReactDOM from 'react-dom';
import './apporblauncher.css';

const MENU_SIZE = 195;
const ORB_SIZE = 50;
const PADDING = 60;

const AppOrbLauncher = ({ appsList, openApp, openAppIds }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
    const [isOpen, setIsOpen] = useState(false);
    const nodeRef = useRef(null);

    // Calculate bounds and initial position
    useEffect(() => {
        const calcBounds = () => {
            const pageWidth = document.documentElement.scrollWidth;
            const pageHeight = document.documentElement.scrollHeight;
            const min = PADDING + MENU_SIZE / 2 - ORB_SIZE / 2;
            const maxX = pageWidth - (MENU_SIZE / 2 + ORB_SIZE / 2 + PADDING);
            const maxY = pageHeight - (MENU_SIZE / 2 + ORB_SIZE / 2 + PADDING);
            setBounds({ left: min, top: min, right: maxX, bottom: maxY });
            setPosition(pos => ({
                x: Math.min(Math.max(pos.x, min), maxX),
                y: Math.min(Math.max(pos.y, min), maxY),
            }));
        };

        // Only set initial position on mount
        if (position.x === 0 && position.y === 0) {
            const pageWidth = document.documentElement.scrollWidth;
            const pageHeight = document.documentElement.scrollHeight;
            const min = PADDING + MENU_SIZE / 2 - ORB_SIZE / 2;
            const maxX = pageWidth - (MENU_SIZE / 2 + ORB_SIZE / 2 + PADDING);
            const maxY = pageHeight - (MENU_SIZE / 2 + ORB_SIZE / 2 + PADDING);
            setPosition({ x: maxX, y: maxY });
        }

        calcBounds();
        window.addEventListener('resize', calcBounds);
        return () => window.removeEventListener('resize', calcBounds);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openAppIds]);

    const handleAppClick = (appId) => {
        openApp(appId);
        setIsOpen(false);
    };

    const totalApps = appsList.length;
    const angleIncrement = 360 / totalApps;
    const radius = 115;

    return ReactDOM.createPortal(
        <Draggable
            nodeRef={nodeRef}
            position={position}
            bounds={bounds}
            onStop={(_, data) => {
                // Clamp position to bounds
                const min = bounds.left;
                const maxX = bounds.right;
                const maxY = bounds.bottom;
                setPosition({
                    x: Math.min(Math.max(data.x, min), maxX),
                    y: Math.min(Math.max(data.y, min), maxY),
                });
            }}
            handle=".app-orb"
        >
            <div className="app-orb-launcher-container" ref={nodeRef}>
                <div className={`app-orb${isOpen ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setIsOpen(!isOpen); }}>
                    <span className="orb-icon">{isOpen ? '−' : '＋'}</span>
                </div>
                {isOpen && (
                    <div className="app-orb-menu">
                        {appsList.map((app, index) => {
                            const angle = index * angleIncrement;
                            const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
                            const y = radius * Math.sin((angle - 90) * (Math.PI / 180));
                            const isActive = openAppIds.includes(app.id);
                            return (
                                <button
                                    key={app.id}
                                    className={`app-orb-item${isActive ? ' active' : ''}`}
                                    style={{ transform: `translate(${x}px, ${y}px)` }}
                                    onClick={() => handleAppClick(app.id)}
                                >
                                    <span className="app-orb-item-icon">{app.name.charAt(0)}</span>
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
};

export default AppOrbLauncher;