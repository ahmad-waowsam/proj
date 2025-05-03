import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../api/chat';

/**
 * AuthGuard component to protect routes that require authentication
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - Either the children or a redirect to the login page
 */
export default function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists in local storage
        const token = localStorage.getItem('access_token');
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Check if session has expired
        const loginTime = localStorage.getItem('login_time');
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        if (loginTime) {
          const elapsedTime = Date.now() - parseInt(loginTime, 10);
          if (elapsedTime > sessionTimeout) {
            // Session expired, clear storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('login_time');
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
        } else {
          // No login time found, set it now
          localStorage.setItem('login_time', Date.now().toString());
        }
        
        // Verify token validity by making an API call
        try {
          await getCurrentUser();
          setIsAuthenticated(true);
        } catch (error) {
          // If API call fails with 401, token is invalid
          if (error.response && error.response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('login_time');
            setIsAuthenticated(false);
          } else {
            // For other errors, assume user is authenticated to prevent lockouts
            setIsAuthenticated(true);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    // Show minimal loading indicator
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #EFBD93',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the current location the user was trying to access
    return <Navigate to="/signin" state={{ from: location.pathname }} />;
  }

  // If authenticated, render the children components
  return children;
}