
import React, { useState } from 'react';
import Button from "../../components/ui/Button/Button";
import styles from './SignupForm.module.css';

const SignupForm = ({ onSubmit, isLoading, apiError }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const validate = () => {
        let newErrors = {};
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email address is invalid';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            // Pass the relevant data up to the parent (SignupPage)
            onSubmit({
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });
            // Optionally clear form after submission if needed, or based on success
            // setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.signupForm}>
            <div className={styles.formGroup}>
                <label htmlFor="username">Username:</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    aria-describedby="username-error"
                    autoComplete="username"
                />
                {errors.username && (
                    <p id="username-error" className={styles.errorText}>
                        {errors.username}
                    </p>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    aria-describedby="email-error"
                    autoComplete="email"
                />
                {errors.email && (
                    <p id="email-error" className={styles.errorText}>
                        {errors.email}
                    </p>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    aria-describedby="password-error"
                    autoComplete="new-password"
                />
                {errors.password && (
                    <p id="password-error" className={styles.errorText}>
                        {errors.password}
                    </p>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    aria-describedby="confirm-password-error"
                    autoComplete="new-password"
                />
                {errors.confirmPassword && (
                    <p id="confirm-password-error" className={styles.errorText}>
                        {errors.confirmPassword}
                    </p>
                )}
            </div>

            {apiError && <p className={styles.errorText}>{apiError}</p>}

            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enrolling...' : 'Sign Up'}
            </Button>
        </form>
    );
};

export default SignupForm;