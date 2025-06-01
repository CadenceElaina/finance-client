import React from 'react'

const Budget = ({ data }) => {
    return (
        <div>
            <h3>Budget Overview</h3>
            <p>This is your budget data: {JSON.stringify(data)}</p>
            {/* Add actual budget UI here */}
        </div>
    );
};
export default Budget