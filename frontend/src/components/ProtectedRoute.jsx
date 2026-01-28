import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Loader from './Loader';
import { useState, useEffect } from 'react';
import { endpoints } from '../config/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                const user = JSON.parse(userStr);
                setIsAuthenticated(true);
                setUserRole(user.role);

                // Fetch fresh user data to check requiresPasswordChange
                const response = await endpoints.auth.getMe();
                if (response.data.user.requiresPasswordChange) {
                    setRequiresPasswordChange(true);
                }
            } catch (error) {
                console.error('Auth verification failed', error);
                // If API fails, still allow access but don't check password change
                // This prevents lockout if API is down
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader size="large" text="Verifying access..." />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if password change is required and redirect
    // Allow access to /change-password itself to avoid infinite loop
    if (requiresPasswordChange && location.pathname !== '/change-password') {
        return <Navigate to="/change-password?forced=true" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect based on role if unauthorized for current route
        if (userRole === 'client') {
            return <Navigate to="/client/orders" replace />;
        } else if (['admin', 'superadmin'].includes(userRole)) {
            return <Navigate to="/home" replace />;
        } else {
            return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
