import React, { createContext, useContext, useState, useCallback } from "react";
import { Alert, Snackbar } from "@mui/material";

// Create the notification context
const NotificationContext = createContext({
  showNotification: () => {},
  clearNotification: () => {},
  notification: null
});

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  // Show notification with specified type, message, and duration
  const showNotification = useCallback((type, message, duration = 6000) => {
    setNotification({ type, message, duration });
  }, []);

  // Clear notification
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        clearNotification,
        notification
      }}
    >
      {children}
      {notification && (
        <Snackbar
          open={!!notification}
          autoHideDuration={notification.duration}
          onClose={clearNotification}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert 
            onClose={clearNotification} 
            severity={notification.type} 
            variant="filled"
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;