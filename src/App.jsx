
import './App.css'
import './styles/global.css';
import AuthPage from './features/Auth/AuthPage'
import DemoPage from './features/Demo/DemoPage'
import HomePage from './features/Home/HomePage'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import DashboardPage from './features/Dashboard/DashboardPage';
import Header from './components/layout/Header/Header';

function App() {


  return (
    <>
      <Router>
        <ThemeProvider >
          <Header />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/demo" element={<DemoPage />} />


              {/* TODO - Protected Routes */}
              <Route path='/' element={<HomePage />} />

              {/* Catch-all for 404 (optional) */}
              <Route path="*" element={<div>404 Not Found</div>} />

            </Routes>
          </main>
        </ThemeProvider>
      </Router>

    </>
  )
}

export default App
