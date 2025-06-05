import React, { useState } from "react";
import SignupForm from "../features/Auth/SignupForm";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
//
const SignupPage = () => {
    const { signup } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const navigate = useNavigate();

    const handleSignup = async (formData) => {
        setIsLoading(true);
        setApiError("");
        try {
            await signup(formData);
            navigate("/dashboard");
        } catch (err) {
            setApiError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SignupForm onSubmit={handleSignup} isLoading={isLoading} apiError={apiError} />
    );
};

export default SignupPage;