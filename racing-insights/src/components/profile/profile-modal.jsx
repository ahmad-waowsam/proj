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
  useTheme,
  Chip,
  Alert,
  Skeleton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RefreshIcon from '@mui/icons-material/Refresh';
import UserProfile from '../../assets/images/dummyUserProfile.jpg';
import { getCurrentUser, getChatHistory } from '../../api/chat';

const ProfileModal = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatStats, setChatStats] = useState({
    totalChats: 0,
    activeDays: 0
  });

  // Listen for the custom event to open the modal
  useEffect(() => {
    const handleOpenModal = (event) => {
      setOpen(true);
      setError(null);
      // If user data is passed with the event, use it
      if (event.detail?.userData) {
        setUserData(event.detail.userData);
        setIsLoading(false);
        // Load chat statistics even when user data is provided via event
        loadChatStats();
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
    setError(null);
  };

  // Load user's chat history and calculate statistics
  const loadChatStats = async () => {
    try {
      // Get user email from localStorage for user-specific history
      let userKey = null;
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsedData = JSON.parse(userData);
        userKey = parsedData.email;
      } else {
        userKey = localStorage.getItem("user_email");
      }
      
      // If no user key is found, we can't load chat stats
      if (!userKey) {
        console.warn("No user key found for loading chat stats");
        return;
      }
      
      // Get all chat history for this user (with higher limit to get more accurate stats)
      const chatHistory = await getChatHistory(null, userKey, 100);
      
      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        // Count total chats
        const totalChats = chatHistory.length;
        
        // Count unique active days
        const uniqueDays = new Set();
        chatHistory.forEach(chat => {
          if (chat.created_at) {
            try {
              const date = new Date(chat.created_at);
              uniqueDays.add(date.toDateString());
            } catch (e) {
              // Skip invalid dates
            }
          }
        });
        
        setChatStats({
          totalChats: totalChats,
          activeDays: uniqueDays.size
        });
      }
    } catch (error) {
      console.error("Error loading chat statistics:", error);
      // Don't set modal error - this is non-critical functionality
    }
  };

  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to get user from API
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('Failed to load user data. Server returned empty response.');
      }
      
      setUserData(user);
      
      // Load chat statistics after user data is loaded
      loadChatStats();
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Unable to load profile data. Please try again.');
      
      // Try to load from localStorage as fallback
      const cachedUserData = localStorage.getItem('user_data');
      if (cachedUserData) {
        try {
          const parsedData = JSON.parse(cachedUserData);
          setUserData(parsedData);
          setError('Using cached profile data. Refresh to try loading latest data.');
          
          // Load chat statistics based on cached user data
          loadChatStats();
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
          // Keep the original error message
        }
      }
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
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
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
          {error && (
            <IconButton 
              onClick={loadUserData}
              color="primary"
              disabled={isLoading}
              title="Retry loading profile data"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
      
      {/* Content */}
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
                <Skeleton variant="circular" width={100} height={100} />
              </Box>
              
              <Box sx={{ ml: { sm: 4 }, flex: 1, width: '100%' }}>
                <Skeleton variant="text" sx={{ fontSize: '2rem', width: '60%' }} />
                <Skeleton variant="text" sx={{ fontSize: '1rem', width: '80%', mt: 1 }} />
                <Skeleton variant="text" sx={{ fontSize: '1rem', width: '70%', mt: 1 }} />
                <Skeleton variant="text" sx={{ fontSize: '1rem', width: '40%', mt: 1 }} />
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Activity Stats
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Skeleton variant="rectangular" width="calc(50% - 8px)" height={80} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width="calc(50% - 8px)" height={80} sx={{ borderRadius: 2 }} />
            </Box>
          </Box>
        ) : (
          <Box sx={{ pt: 2 }}>
            {/* Profile Header */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
                <Avatar
                  src={UserProfile} // Always use the default image since we don't store custom images
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
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {userData?.username || 'User'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" color="text.secondary">
                    {userData?.email || 'No email provided'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body1" color="text.secondary">
                    Joined {formatJoinDate()}
                  </Typography>
                </Box>
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
                  {chatStats.totalChats || '0'}
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
                  {chatStats.activeDays || '0'}
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
        <Button onClick={handleClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileModal;