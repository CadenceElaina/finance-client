
import DashboardPage from '../Dashboard/DashboardPage'
import React from 'react';
// DEMO USER's settings and data
import GetWindowSize from '../GetWindowSize';

const DemoPage = () => {
    const { width, height } = GetWindowSize();
    return (
        <>
            <p>Window Width: {width}px</p>
            <p>Window Height: {height}px</p>
            <DashboardPage />
        </>
    )
}

export default DemoPage