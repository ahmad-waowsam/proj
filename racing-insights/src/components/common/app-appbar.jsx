import React, { useContext, useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import { 
  Box, 
  Typography, 
  IconButton, 
  useMediaQuery, 
  useTheme, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Divider, 
  Tooltip, 
  Avatar, 
  Badge 
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import MenuIcon from "@mui/icons-material/Menu";
import UserProfile from "../../assets/images/dummyUserProfile.jpg";
import { ThemeContext } from "../../constants/ThemeContext";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../../api/chat";
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

export default function AppAppBar({ toggleDrawer, drawerOpen }) {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const openUserMenu = Boolean(userMenuAnchorEl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Format current time as HH:MM AM/PM
  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });

  // Check if user is logged in and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          setIsLoggedIn(true);
          try {
            const userData = await getCurrentUser();
            setCurrentUser(userData);
            
            // Store user data in localStorage for persistence
            localStorage.setItem('user_data', JSON.stringify({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              is_active: userData.is_active
            }));
          } catch (error) {
            // If token is invalid, clear it
            if (error.response?.status === 401) {
              localStorage.removeItem("access_token");
              setIsLoggedIn(false);
            } else {
              // Try to load cached user data if API fails but token exists
              const cachedUserData = localStorage.getItem('user_data');
              if (cachedUserData) {
                setCurrentUser(JSON.parse(cachedUserData));
              }
            }
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };

    checkAuth();
  }, []);

  // Session timeout management
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const tokenExpiry = 30 * 60 * 1000; // 30 minutes in milliseconds
    const interval = setInterval(() => {
      const loginTime = localStorage.getItem('login_time');
      if (!loginTime) {
        localStorage.setItem('login_time', Date.now().toString());
        return;
      }
      
      const elapsed = Date.now() - parseInt(loginTime);
      const remaining = Math.max(0, tokenExpiry - elapsed);
      
      // Format remaining time as MM:SS
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setSessionTimeRemaining(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      
      // Auto logout when session expires
      if (remaining <= 0) {
        clearInterval(interval);
        handleLogout();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser) return "U";
    
    const username = currentUser.username || '';
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    
    const email = currentUser.email || '';
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    
    return "U";
  };

  const handleUserMenuClick = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout(); // This will clear the token from localStorage
    localStorage.removeItem('login_time');
    localStorage.removeItem('user_data');
    setCurrentUser(null);
    setIsLoggedIn(false);
    handleUserMenuClose();
    navigate('/signin');
  };

  const handleLogin = () => {
    navigate('/signin');
  };
  
  const handleViewProfile = () => {
    handleUserMenuClose();
    // Implemented as a modal in the current page instead of navigation
    // This will trigger the profile modal to open
    window.dispatchEvent(new CustomEvent('open-profile-modal', { 
      detail: { userData: currentUser } 
    }));
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(18, 18, 18, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 'var(--shadow-sm)',
        zIndex: theme => theme.zIndex.drawer + 1,
        height: 64,
        transition: 'all 0.3s ease',
      }}
      elevation={0}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          px: { xs: 2, sm: 3 },
          height: "100%",
        }}
      >
        {/* Left section: Drawer toggle (mobile) + Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label={drawerOpen ? "close drawer" : "open drawer"}
              onClick={toggleDrawer}
              edge="start"
              sx={{ mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#000000',
              cursor: "pointer",
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
            onClick={() => navigate('/chat')}
          >
            Racing Insights
          </Typography>
        </Box>

        {/* Center section: Navigation links on desktop */}
        {!isMobile && (
          <Box sx={{ display: "flex", gap: 4 }}>
            <Box
              component="a"
              onClick={(e) => {
                e.preventDefault();
                navigate('/chat');
              }}
              href="/chat"
              sx={{
                display: "flex",
                alignItems: "center",
                color: "text.primary",
                textDecoration: "none",
                gap: 1,
                py: 1,
                px: 1.5,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ChatIcon fontSize="small" />
              <Typography variant="body2" fontWeight={500}>Chat</Typography>
            </Box>
          </Box>
        )}

        {/* Right section: Clock + Theme toggle + User profile */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 3 } }}>
          {/* Clock widget */}
          <Box 
            sx={{ 
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center', 
              gap: 0.5,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              py: 0.5,
              px: 1.5,
              borderRadius: 2
            }}
          >
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, userSelect: 'none' }}
            >
              {formattedTime}
            </Typography>
          </Box>
          
          {/* Session timer */}
          {sessionTimeRemaining && isLoggedIn && (
            <Tooltip title="Session time remaining">
              <Box sx={{ 
                display: { xs: 'none', md: 'flex' }, 
                alignItems: 'center', 
                gap: 0.5,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                py: 0.5,
                px: 1.5,
                borderRadius: 2
              }}>
                <AccessTimeIcon fontSize="small" color="error" />
                <Typography 
                  variant="body2" 
                  color="error" 
                  sx={{ fontWeight: 500, userSelect: 'none' }}
                >
                  {sessionTimeRemaining}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Theme toggle */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              color="inherit"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                p: 1,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                }
              }}
              aria-label="toggle dark mode"
            >
              {theme.palette.mode === 'dark' ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {/* User Profile Avatar */}
          <Tooltip title={isLoggedIn ? "Your profile" : "Sign in"}>
            <IconButton
              onClick={isLoggedIn ? handleUserMenuClick : handleLogin}
              sx={{
                p: 0.5,
                position: 'relative',
              }}
              aria-controls={openUserMenu ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openUserMenu ? 'true' : undefined}
            >
              {isLoggedIn && currentUser ? (
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#44b700',
                      color: '#44b700',
                      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                      '&::after': {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        animation: 'ripple 1.2s infinite ease-in-out',
                        border: '1px solid currentColor',
                        content: '""',
                      },
                    },
                    '@keyframes ripple': {
                      '0%': {
                        transform: 'scale(.8)',
                        opacity: 1,
                      },
                      '100%': {
                        transform: 'scale(2.4)',
                        opacity: 0,
                      },
                    },
                  }}
                >
                  <Avatar
                    alt={currentUser.username || "User"}
                    src={UserProfile}
                    sx={{
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      fontSize: isMobile ? '0.9rem' : '1.1rem',
                      fontWeight: 'bold',
                      bgcolor: theme.palette.primary.main,
                      color: '#fff',
                      border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : theme.palette.primary.light}`,
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                </Badge>
              ) : (
                <Avatar
                  src={UserProfile}
                  alt="Sign In"
                  sx={{
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                  }}
                />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchorEl}
        open={openUserMenu}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 280,
            maxWidth: '100%',
            mt: 1.5,
            borderRadius: 2,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              fontSize: '0.9rem',
              borderRadius: 1,
              mx: 0.5,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {currentUser && (
          <Box sx={{ px: 2, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar
                alt={currentUser.username || "User"}
                src={UserProfile}
                sx={{ 
                  width: 42, 
                  height: 42,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  mr: 1.5
                }}
              >
                {getUserInitials()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                  {currentUser.username || "User"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                  {currentUser.email || localStorage.getItem('user_email') || ""}
                </Typography>
              </Box>
            </Box>
            <Typography 
              variant="caption" 
              component="div" 
              sx={{ 
                mt: 1, 
                color: theme.palette.success.main,
                display: 'flex',
                alignItems: 'center' 
              }}
            >
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'success.main', 
                  mr: 0.5,
                  display: 'inline-block' 
                }} 
              />
              Active {currentUser.is_active !== false ? 'now' : 'user'}
            </Typography>
          </Box>
        )}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleViewProfile}>
          <ListItemIcon>
            <AccountCircleOutlinedIcon fontSize="small" />
          </ListItemIcon>
          View Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
