import React, { useState } from 'react';
import { Box, Typography, Switch, useTheme } from '@mui/material';

const NotificationSettings = () => {
  const theme = useTheme();
  
  // Define notification types with their initial states
  const [notifications, setNotifications] = useState([
    { id: 1, label: 'Enable promotion notifications', enabled: true },
    { id: 2, label: 'Enable race result notifications', enabled: false },
    { id: 3, label: 'Enable jockey update notifications', enabled: false },
    { id: 4, label: 'Enable horse news notifications', enabled: true },
  ]);

  // Handle toggle changes
  const handleToggleChange = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, enabled: !notification.enabled } 
        : notification
    ));
  };

  return (
    <Box sx={{ 
      border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E7EB',
      borderRadius: 3,
      p: { xs: 2, sm: 3 }
    }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Notification
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #F4F4F4',
      }}>
        {notifications.map((notification, index) => (
          <Box 
            key={notification.id}
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 3,
              borderBottom: index < notifications.length - 1 
                ? theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid #F4F4F4' 
                : 'none'
            }}
          >
            <Typography sx={{ fontWeight: 500 }}>
              {notification.label}
            </Typography>
            <Switch
              checked={notification.enabled}
              onChange={() => handleToggleChange(notification.id)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#000',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#F1B771',
                },
                '& .MuiSwitch-track': {
                  backgroundColor: '#E5E5E5',
                },
                '& .MuiSwitch-thumb': {
                  backgroundColor: notification.enabled ? '#000' : '#FFF',
                },
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default NotificationSettings;