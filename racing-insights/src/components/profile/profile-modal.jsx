import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Box, 
  Avatar, 
  Button, 
  IconButton,
  Divider,
  Paper,
  TextField,
  CircularProgress,
  useTheme,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import UserProfile from '../../assets/images/dummyUserProfile.jpg';
import { getCurrentUser, updateUserProfile } from '../../api/chat';

const ProfileModal = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });

  // Listen for the custom event to open the modal
  useEffect(() => {
    const handleOpenModal = (event) => {
      setOpen(true);
      // If user data is passed with the event, use it
      if (event.detail?.userData) {
        setUserData(event.detail.userData);
        setFormData({
          username: event.detail.userData.username || '',
          email: event.detail.userData.email || '',
        });
        setIsLoading(false);
      } else {
        // Otherwise load from API
        loadUserData();
      }
    };
    
    window.addEventListener('open-profile-modal', handleOpenModal);
    return () => window.removeEventListener('open-profile-modal', handleOpenModal);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
  };

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Try to get user from API
      const user = await getCurrentUser();
      setUserData(user);
      setFormData({
        username: user.username || '',
        email: user.email || '',
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      
      // If API fails, try to load from localStorage
      const cachedUserData = localStorage.getItem('user_data');
      if (cachedUserData) {
        try {
          const parsedData = JSON.parse(cachedUserData);
          setUserData(parsedData);
          setFormData({
            username: parsedData.username || '',
            email: parsedData.email || '',
          });
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle edit mode
  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Discard changes when canceling edit mode
      setFormData({
        username: userData?.username || '',
        email: userData?.email || '',
      });
    }
    setIsEditMode(!isEditMode);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle save profile changes
  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // In a real app, save changes to backend
      await updateUserProfile({
        username: formData.username,
      });
      
      // Update local state
      setUserData({
        ...userData,
        ...formData,
      });
      
      // Update localStorage
      const cachedUserData = localStorage.getItem('user_data');
      if (cachedUserData) {
        try {
          const parsedData = JSON.parse(cachedUserData);
          const updatedData = {
            ...parsedData,
            ...formData
          };
          localStorage.setItem('user_data', JSON.stringify(updatedData));
        } catch (e) {
          console.error('Error updating user data in localStorage:', e);
        }
      }
      
      setIsEditMode(false);
      
      // Dispatch an event to inform other components of the profile update
      window.dispatchEvent(new CustomEvent('profile-updated', { 
        detail: { userData: {...userData, ...formData} } 
      }));
    } catch (error) {
      console.error('Error saving profile changes:', error);
      // Show error message to user (you might want to add a snackbar/alert here)
    } finally {
      setIsLoading(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData) return 'U';
    
    const username = userData.username || '';
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    
    const email = userData.email || '';
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };
  
  // Format join date
  const formatJoinDate = () => {
    if (!userData?.created_at) return 'N/A';
    
    try {
      const date = new Date(userData.created_at);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2
        }}
      >
        <Typography variant="h6" fontWeight="bold">User Profile</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={handleToggleEditMode}
            color="primary"
            disabled={isLoading}
            sx={{ 
              bgcolor: isEditMode ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
      
      {/* Content */}
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ pt: 2 }}>
            {/* Profile Header */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
                <Avatar
                  src={UserProfile}
                  alt={userData?.username || 'User'}
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    bgcolor: theme.palette.primary.main,
                    color: '#fff',
                    border: `3px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : theme.palette.primary.light}`,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    mb: 1
                  }}
                >
                  {getUserInitials()}
                </Avatar>
                {userData?.is_active !== false && (
                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      bgcolor: 'success.main',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      mt: 1
                    }}
                  />
                )}
              </Box>
              
              <Box sx={{ ml: { sm: 4 }, flex: 1, width: '100%' }}>
                {isEditMode ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      variant="outlined"
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      variant="outlined"
                      fullWidth
                      size="small"
                      disabled
                    />
                  </Box>
                ) : (
                  <>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {userData?.username || 'User'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
                      <Typography variant="body1" color="text.secondary">
                        {userData?.email || 'No email provided'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
                      <Typography variant="body1" color="text.secondary">
                        {userData?.role || 'Standard User'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
                      <Typography variant="body1" color="text.secondary">
                        Joined {formatJoinDate()}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ 
              my: 2,
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }} />
            
            {/* Activity Stats */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Activity Stats
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  flex: '1 0 160px',
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'background.paper',
                  border: '1px solid',
                  borderColor: "divider"
                }}
              >
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  {userData?.chat_count || '0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Chats
                </Typography>
              </Paper>
              
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  flex: '1 0 160px',
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'background.paper',
                  border: '1px solid',
                  borderColor: "divider"
                }}
              >
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  {userData?.last_active_days || '0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Days Active
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      {/* Actions */}
      <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
        {isEditMode ? (
          <>
            <Button onClick={handleToggleEditMode} color="inherit">Cancel</Button>
            <Button 
              onClick={handleSaveChanges} 
              variant="contained"
              disabled={!formData.username.trim() || !formData.email.trim()}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="outlined">Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProfileModal;