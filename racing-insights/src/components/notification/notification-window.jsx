import React from 'react';
import { Box, Typography, IconButton, Popover, useTheme } from '@mui/material';
import BlackNotificationBellIcon from '../../assets/icons/notification-bell-black.svg';
import WhiteNotificationBellIcon from '../../assets/icons/notification-bell-white.svg';
import NotificationMessage from '../../assets/icons/notification-message.svg';

const notifications = [
  {
    id: 1,
    message: 'You got new notification.',
    time: '10:00 AM',
    read: false
  },
  {
    id: 2,
    message: 'You got new notification.',
    time: '10:00 AM',
    read: false
  },
  {
    id: 3,
    message: 'You got new notification.',
    time: '10:00 AM',
    read: false
  },
  {
    id: 4,
    message: 'You got new notification.',
    time: '10:00 AM',
    read: true
  },
  {
    id: 5,
    message: 'You got new notification.',
    time: '10:00 AM',
    read: true
  }
];

export default function NotificationWindow({ anchorEl, onClose, open, mode }) {
  const theme = useTheme();
  
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      sx={{
        '& .MuiPaper-root': {
          width: '420px',
          maxHeight: '400px',
          overflow: 'hidden',
          mt: 1,
          boxShadow: theme.shadows[3],
          borderRadius: '12px',
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white',
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Notifications
        </Typography>
      </Box>

      <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
        {notifications.map((notification) => (
          <Box
            key={notification.id}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <img 
              src={NotificationMessage} 
              alt="notification" 
              style={{ 
                width: '20px',
                height: '20px',
                marginTop: '2px',
                filter: theme.palette.mode === 'dark' ? 'brightness(10)' : 'none'
              }}
            />
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 2
            }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {notification.message}
                  <Typography
                    component="span"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      cursor: 'pointer',
                      ml: 0.5,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Click to read.
                  </Typography>
                </Typography>
              </Box>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  whiteSpace: 'nowrap',
                  mt: 0.5
                }}
              >
                {notification.time}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box 
        sx={{ 
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box
          component="a"
          href="/notifications"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/notifications';
            onClose();
          }}
          sx={{
            color: theme.palette.mode === 'dark' ? theme.palette.primary.main : "black",
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: '1rem',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          View All →
        </Box>
      </Box>
    </Popover>
  );
}