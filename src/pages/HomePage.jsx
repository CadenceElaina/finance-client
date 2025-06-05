import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/layout/Header/Header'

const HomePage = () => {
    return (
        <>
            <div>HomePage

                <Link to={"/demo"}>Demo</Link>
            </div>
        </>
    )
}

export default HomePage