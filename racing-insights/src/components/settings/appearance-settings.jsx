import React, { useContext } from 'react';
import { Box, Typography, Switch, useTheme } from '@mui/material';
import { ThemeContext } from '../../constants/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const AppearanceSettings = () => {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      border: '1px solid #E5E7EB',
      borderRadius: 3,
      p: { xs: 2, sm: 3 }
    }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Appearance
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #F4F4F4',
      }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {mode === 'dark' ? 
              <DarkModeIcon sx={{ color: theme.palette.primary.main }} /> : 
              <LightModeIcon sx={{ color: theme.palette.primary.main }} />
            }
            <Box>
              <Typography sx={{ fontWeight: 500 }}>
                Dark Mode
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Switch between light and dark themes
              </Typography>
            </Box>
          </Box>
          <Switch
            checked={mode === 'dark'}
            onChange={toggleTheme}
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
                backgroundColor: mode === 'dark' ? '#000' : '#FFF',
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AppearanceSettings;
