import React from 'react';
import { Box, Typography, Container, Button, useTheme, useMediaQuery } from '@mui/material';
import AppAppBar from '../../components/common/app-appbar';
import PersonalDetails from '../../components/settings/personal-details';
import PasswordDetails from '../../components/settings/password-details';
import NotificationSettings from '../../components/settings/notification-settings';
import AppearanceSettings from '../../components/settings/appearance-settings';

const Settings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#F9FAFB'
    }}>
      <AppAppBar />
      
      <Box sx={{ 
        height: 'calc(100vh - 80px)',
        overflow: 'auto',
        mt: { xs: 8, sm: 10 },
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f1f1',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#888',
          borderRadius: '10px',
          '&:hover': {
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#555',
          },
        },
      }}> 
        <Container 
          disableGutters
          maxWidth={false}
          sx={{ 
            maxWidth: {
              xs: '100%',
              lg: '100vw'
            },
            p: '0 !important', // Override MUI's default padding
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%', 
            marginLeft: 0,
            paddingLeft: 0,
            marginRight: 'auto',
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white',
            borderRadius: 2,
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E7EB',
            boxShadow: theme.palette.mode === 'dark' ? 'none' : '0px 4px 20px rgba(0, 0, 0, 0.05)',
          }}>
            {/* Header with Settings title and global buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 2, sm: 0 },
              mb: { xs: 3, sm: 4 }
            }}>
              <Typography 
                variant="h5" 
                fontWeight="bold"
                sx={{
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Settings
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button 
                  fullWidth={isMobile}
                  variant="text" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#667085',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F4F4F4',
                    borderRadius: '8px',
                    px: 3,
                    py: 1.5,
                    textTransform: 'none',
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  fullWidth={isMobile}
                  variant="contained" 
                  sx={{ 
                    backgroundColor: theme.palette.primary.main,
                    color: '#000',
                    borderRadius: '8px',
                    px: 3,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#E5A75F',
                    }
                  }}
                >
                  Update
                </Button>
              </Box>
            </Box>

            {/* Two-column layout for desktop */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 4, sm: 6 }
            }}>
              {/* Left column - Personal Details */}
              <Box>
                <PersonalDetails />
              </Box>
              
              {/* Right column - Password Details, Appearance and Notification Settings */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: { xs: 4, sm: 6 }
              }}>
                <PasswordDetails />
                <AppearanceSettings />
                <NotificationSettings />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Settings;