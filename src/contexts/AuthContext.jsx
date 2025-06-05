import React, { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("token"));

    useEffect(() => {
        if (token) localStorage.setItem("token", token);
        else localStorage.removeItem("token");
    }, [token]);

    // Changed 'email' to 'identifier'
    const login = async ({ identifier, password }) => {
        const data = await authService.login({ identifier, password });
        setToken(data.token);
        // Compose a user object from the returned fields
        setUser({
            username: data.username,
            email: data.email,
            name: data.name,
            id: data.id,
        });
    };

    const signup = async ({ username, email, password }) => {
        await authService.signup({ username, email, password });
        await login({ identifier: username, password });
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);