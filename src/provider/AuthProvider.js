import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [token, setToken_] = useState(localStorage.getItem("token"));
    const [refreshToken, setRefreshToken_] = useState(localStorage.getItem("refreshToken"));
    const [expiresIn, setExpiresIn_] = useState(localStorage.getItem("expiresIn"));
    const [email, setEmail_] = useState(localStorage.getItem("email"));

    const [expirationTime, setExpirationTime] = useState(null);

    const setToken = (newToken, newRefreshToken, newExpiresIn, userEmail) => {
        setToken_(newToken);
        setRefreshToken_(newRefreshToken);
        setExpiresIn_(newExpiresIn);
        setEmail_(userEmail);

        const expirationDateInMilliseconds = new Date(new Date().getTime() + newExpiresIn * 1000);
        setExpirationTime(expirationDateInMilliseconds);

        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        localStorage.setItem("expiresIn", newExpiresIn);
        localStorage.setItem("email", userEmail);
    };

    useEffect(() => {
        const storedExpirationTime = localStorage.getItem("expirationTime");
        if (storedExpirationTime) {
            setExpirationTime(new Date(storedExpirationTime));
        }

        if (token) {
            axios.defaults.headers.common["Authorization"] = "Bearer " + token;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
    }, [token]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (expirationTime && new Date() >= new Date(expirationTime)) {
                refreshAuthToken();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [expirationTime]);

    const refreshAuthToken = async () => {
        try {
            const response = await axios.post("https://localhost:44397/refresh", refreshToken);
            const { token, refreshToken: newRefreshToken, expiresIn } = response.data;
            setToken(token, newRefreshToken, expiresIn);
        } catch (error) {
            console.error("Failed to refresh token", error);
            setToken(null, null, null, null);
        }
    };

    const contextValue = useMemo(() =>
    ({
        token,
        refreshToken,
        expiresIn,
        email,
        setToken,
    }),
        [token, refreshToken, expiresIn, email]
    );

    return (
        <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthProvider;
