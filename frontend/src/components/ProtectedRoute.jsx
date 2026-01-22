import { Navigate, useLocation } from 'react-router-dom';
import Loader from './Loader';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const verifyAuth = () => {
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
            } catch (error) {
                console.error('Auth verification failed', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
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
