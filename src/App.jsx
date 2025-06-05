
import './App.css'
import HomePage from './pages/HomePage';
import SignupPage from './pages/SignupPage';
import DemoPage from './pages/DemoPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/layout/Header/Header';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';



function App() {


  return (
    <>
      <Router>
        <ThemeProvider >
          <AuthProvider>
            <Header />
            <main>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/demo" element={<DemoPage />} />


                {/* TODO - Protected Routes */}
                <Route path='/' element={<HomePage />} />

                {/* Catch-all for 404*/}
                <Route path="*" element={<div>404 Not Found</div>} />

              </Routes>
            </main>
          </AuthProvider>
        </ThemeProvider>
      </Router>

    </>
  )
}

export default App
