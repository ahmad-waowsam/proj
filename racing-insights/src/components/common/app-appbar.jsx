import React, { useContext, useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import { Box, Typography, IconButton, useMediaQuery, useTheme, Menu, MenuItem, ListItemIcon, Divider, Tooltip, Avatar, Badge } from "@mui/material";
import ChatIcon from "../../assets/icons/chat.svg";
import UserProfile from "../../assets/images/dummyUserProfile.jpg";
import { ThemeContext } from "../../constants/ThemeContext";
import ThemeToggle from "./theme-toggle";
import { useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../../api/chat";
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

export default function AppAppBar() {
  const { mode } = useContext(ThemeContext);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(null);
  const openUserMenu = Boolean(userMenuAnchorEl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

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
    <Box>
      <AppBar
        sx={{
          p: { xs: 2, sm: 3 },
          backgroundColor: "background.default",
          boxShadow: "none",
          borderBottom: 1,
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : "secondary.main",
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            position: "relative",
            alignItems: "center",
            gap: { xs: 2, sm: 3 },
          }}
        >
          <Typography 
            variant="h4" 
            fontWeight="bold"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' },
              cursor: "pointer",
              color: theme.palette.mode === 'dark' ? theme.palette.primary.main : 'inherit'
            }}
            onClick={() => navigate('/chat')}
          >
            Racing Insights
          </Typography>
          
          {/* Navigation Links */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              position: { md: "absolute" },
              left: { md: "50%" },
              transform: { md: "translateX(-50%)" },
              alignItems: "center",
              gap: { md: 4, lg: 8 },
            }}
          >
            <NavLink href="/chat" icon={ChatIcon} text="Chat" />
          </Box>

          {/* Right side elements */}
          <Box
            sx={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: { xs: 2, sm: 3 },
            }}
          >
            {/* Session timer */}
            {sessionTimeRemaining && isLoggedIn && (
              <Tooltip title="Session time remaining">
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.85rem' }
                }}>
                  <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">{sessionTimeRemaining}</Typography>
                </Box>
              </Tooltip>
            )}
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User Profile Avatar */}
            <Tooltip title={isLoggedIn ? "Your profile" : "Sign in"}>
              <IconButton
                onClick={isLoggedIn ? handleUserMenuClick : handleLogin}
                sx={{
                  p: 0,
                  position: 'relative',
                }}
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
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchorEl}
        open={openUserMenu}
        onClose={handleUserMenuClose}
        PaperProps={{
          elevation: 2,
          sx: {
            width: 240,
            maxWidth: '100%',
            mt: 1.5,
            borderRadius: 2,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              fontSize: '0.9rem',
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
                  width: 40, 
                  height: 40,
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
        <Divider />
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
    </Box>
  );
}

// Helper component for navigation links
function NavLink({ href, icon, text }) {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Updated SVG chat icon - black and slightly modified design
  const blackChatIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${theme.palette.mode === 'dark' ? 'white' : 'black'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`;
  
  return (
    <Box
      component="a"
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      href={href}
      sx={{
        display: "flex",
        alignItems: "center",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      {text === "Chat" ? (
        <img
          src={blackChatIcon}
          alt=""
          style={{ 
            height: "20px",
            width: "20px"
          }}
        />
      ) : (
        <img
          src={icon}
          alt=""
          style={{ 
            height: "20px",
            filter: theme.palette.mode === 'dark' ? 'brightness(10)' : 'none'
          }}
        />
      )}
      <Box sx={{ mt: "3px", ml: 0.5 }}>
        <Typography variant="body2">{text}</Typography>
      </Box>
    </Box>
  );
}
