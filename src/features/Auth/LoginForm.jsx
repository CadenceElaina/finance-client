import React, { useState } from 'react';
import styles from './SignupForm.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
    // 1. Change 'email' to 'identifier' in the state
    const [form, setForm] = useState({ identifier: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // The `login` function from useAuth now expects 'identifier'
            await login(form);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className={styles.signupForm} onSubmit={handleSubmit} autoComplete="off">
            <h2 className="text-center">Log In</h2>
            <div className={styles.formGroup}>
                {/* 2. Update label and input for 'identifier' */}
                <label htmlFor="login-identifier">Username or Email</label>
                <input
                    id="login-identifier"
                    name="identifier" // Crucially change the name to 'identifier'
                    type="text" // Use 'text' type since it can be either username or email
                    autoComplete="username" // Or consider "off" if you want to explicitly avoid browser suggestions
                    placeholder="Enter your username or email"
                    value={form.identifier}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="login-password">Password</label>
                <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
            </div>
            {error && <div className={styles.errorText}>{error}</div>}
            <button type="submit" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Log In'}</button>
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.95rem' }}>
                Don’t have an account? <a href="/signup">Sign Up</a>
            </div>
            <div style={{ marginTop: 8, textAlign: 'center', fontSize: '0.9rem' }}>
                <a href="/forgot-password">Forgot your password?</a>
            </div>
        </form>
    );
};

export default LoginForm;