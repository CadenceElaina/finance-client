
import './App.css'
import './styles/global.css';
import AuthPage from './features/Auth/AuthPage'
import DemoPage from './features/Demo/DemoPage'
import HomePage from './features/Home/HomePage'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {


  return (
    <>
      <Router>
        <ThemeProvider >
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/demo" element={<DemoPage />} />

              {/* TODO - Protected Routes */}


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
