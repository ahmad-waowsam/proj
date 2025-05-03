import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import NotificationMessage from '../../assets/icons/notification-message.svg';
import AppAppBar from '../../components/common/app-appbar';
import { ThemeContext } from '../../constants/ThemeContext';

const notifications = {
  TODAY: [
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
      read: false
    }
  ],
  YESTERDAY: [
    {
      id: 5,
      message: 'You got new notification.',
      time: '10:00 AM',
      read: true
    },
    {
      id: 6,
      message: 'You got new notification.',
      time: '10:00 AM',
      read: true
    },
    {
      id: 7,
      message: 'You got new notification.',
      time: '10:00 AM',
      read: true
    },
    {
      id: 8,
      message: 'You got new notification.',
      time: '10:00 AM',
      read: true
    }
  ]
};

export default function NotificationPage() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <AppAppBar />
      <Box
        sx={{
          width: '100%',
          height: 'calc(100vh - 80px)', // Fixed height for AppBar
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 10, sm: 12 },
          px: { xs: 3, sm: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Typography variant="h5" fontWeight={550}>
            Notifications
          </Typography>
          <Button
            variant="contained"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'black',
              textTransform: 'none',
              width: { xs: '100%', sm: '200px' },
              px: 2,
              '&:hover': {
                bgcolor: '#FFE4D1',
              },
            }}
          >
            Mark all as read
          </Button>
        </Box>

        <Box 
          sx={{ 
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '10px',
              '&:hover': {
                background: '#555',
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
            {Object.entries(notifications).map(([date, items]) => (
              <Box key={date}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  {date}
                </Typography>

                <Box sx={{ 
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: '1fr',
                    xl: '1fr'
                  }
                }}>
                  {items.map((notification) => (
                    <Box
                      key={notification.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'white',
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
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
                        }}
                      />
                      <Box
                        sx={{
                          flex: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="body2">
                            {notification.message}
                            <Typography
                              component="span"
                              sx={{
                                color: '#7F5634',
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
                          }}
                        >
                          {notification.time}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}