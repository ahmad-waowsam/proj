import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Avatar, InputAdornment } from '@mui/material';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { ThemeContext } from '../../constants/ThemeContext';
import { useTheme } from '@mui/material/styles';

const PersonalDetails = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePicture(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = () => {
    // Implement update logic here
    console.log('Updating personal details');
  };

  const handleCancel = () => {
    // Implement cancel logic here
    console.log('Cancelling changes');
  };
  const theme = useTheme();
  return (
    <Box sx={{ 
      border: '1px solid #E5E7EB',
      borderRadius: 3,
      height: '100%',
      p: { xs: 2, sm: 3 }
    }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Personal Details
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, sm: 4 } }}>
        {/* Profile Picture Upload */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 }
        }}>
          <Box
            sx={{
              position: 'relative',
              width: { xs: 120, sm: 100 },
              height: { xs: 120, sm: 100 },
              borderRadius: '50%',
              backgroundColor: '#F4F4F4',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {previewUrl ? (
              <Avatar 
                src={previewUrl} 
                sx={{ width: '100%', height: '100%' }} 
              />
            ) : (
              <CameraAltOutlinedIcon sx={{ fontSize: { xs: 40, sm: 32 }, color: '#667085' }} />
            )}
            <input
              type="file"
              accept="image/png, image/jpeg"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
              onChange={handleFileChange}
            />
          </Box>
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography sx={{ fontWeight: 500 }}>Upload Profile Picture</Typography>
            <Typography variant="body2" sx={{ color: '#667085' }}>
              Max size 2mb. Png, JPG supported
            </Typography>
          </Box>
        </Box>

        {/* Form Fields */}
        <Box sx={{ width: '100%' }}>
          <Typography sx={{ mb: 1, fontWeight: 500 }}>Full Name</Typography>
          <TextField
            fullWidth
            placeholder="E.g Adam Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineOutlinedIcon sx={{ color: '#667085' }} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#F4F4F4',
                borderRadius: '8px',
                '& fieldset': { border: 'none' },
                height: { xs: '48px', sm: '44px' }
              }
            }}
          />
        </Box>

        <Box sx={{ width: '100%' }}>
          <Typography sx={{ mb: 1, fontWeight: 500 }}>Email</Typography>
          <TextField
            fullWidth
            placeholder="E.g Adam@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: '#667085' }} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#F4F4F4',
                borderRadius: '8px',
                '& fieldset': { border: 'none' },
                height: { xs: '48px', sm: '44px' }
              }
            }}
          />
        </Box>

        <Box sx={{ width: '100%' }}>
          <Typography sx={{ mb: 1, fontWeight: 500 }}>Phone</Typography>
          <TextField
            fullWidth
            placeholder="E.g +1 141 141 44"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneOutlinedIcon sx={{ color: '#667085' }} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#F4F4F4',
                borderRadius: '8px',
                '& fieldset': { border: 'none' },
                height: { xs: '48px', sm: '44px' }
              }
            }}
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mt: { xs: 2, sm: 0 }
        }}>
          <Button
            fullWidth
            variant="text"
            onClick={handleCancel}
            sx={{
              color: '#667085',
              backgroundColor: '#F4F4F4',
              borderRadius: '8px',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#E5E5E5',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
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

export default PersonalDetails;