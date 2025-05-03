import React, { useState } from 'react';
import { Box, Typography, TextField, Button, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTheme } from '@mui/material/styles';

const PasswordDetails = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClickShowCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const handleClickShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleUpdate = () => {
    // Implement update logic here
    console.log('Updating password');
  };

  const handleForgotPassword = () => {
    // Implement forgot password logic here
    console.log('Forgot password');
  };
  const theme = useTheme();
  return (
    <Box sx={{ 
      border: '1px solid #E5E7EB',
      borderRadius: 3,
      p: { xs: 2, sm: 3 }
    }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Password Details
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Current Password */}
        <Box>
          <Typography sx={{ mb: 1, fontWeight: 500 }}>Current Password</Typography>
          <TextField
            fullWidth
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Password Here"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: '#667085' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowCurrentPassword}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#F4F4F4',
                borderRadius: '8px',
                '& fieldset': { border: 'none' },
              }
            }}
          />
        </Box>

        {/* New Password */}
        <Box>
          <Typography sx={{ mb: 1, fontWeight: 500 }}>New Password</Typography>
          <TextField
            fullWidth
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Password Here"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: '#667085' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowNewPassword}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#F4F4F4',
                borderRadius: '8px',
                '& fieldset': { border: 'none' },
              }
            }}
          />
        </Box>

        {/* Confirm Password */}
        <Box>
          <Typography sx={{ mb: 1, fontWeight: 500 }}>Confirm Password</Typography>
          <TextField
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Password Here"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: '#667085' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowConfirmPassword}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#F4F4F4',
                borderRadius: '8px',
                '& fieldset': { border: 'none' },
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="text"
            onClick={handleForgotPassword}
            sx={{
              color: '#667085',
              textTransform: 'none',
              fontWeight: 500,
              px: 0,
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline',
              }
            }}
          >
            Forgot Password
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: '#000',
              borderRadius: '8px',
              px: 4,
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
    </Box>
  );
};

export default PasswordDetails;