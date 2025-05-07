import React, { useState, useEffect, useCallback } from "react";
import AppAppBar from "../../components/common/app-appbar";
import ChatDrawer from "../../components/chat/chat-drawer";
import ProfileModal from "../../components/profile/profile-modal";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import ChatWindow from "../../components/chat/chat-window";

export default function Chat() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [chatKey, setChatKey] = useState(0);
  const [isNewChat, setIsNewChat] = useState(false);

  // Handle drawer toggle via callback to pass to AppBar
  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  // Set drawer state based on screen size when it changes
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  // Close drawer on mobile when a history item is clicked
  useEffect(() => {
    const closeDrawer = () => {
      if (isMobile) {
        setDrawerOpen(false);
      }
    };
    
    window.addEventListener('close-chat-drawer', closeDrawer);
    return () => window.removeEventListener('close-chat-drawer', closeDrawer);
  }, [isMobile]);

  const handleNewChat = () => {
    setIsNewChat(true);
    setChatKey(prevKey => prevKey + 1);
    
    // Reset isNewChat after a brief delay to ensure it's processed
    setTimeout(() => setIsNewChat(false), 100);
    
    // Close drawer on mobile when creating a new chat
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {/* AppBar with drawer toggle function */}
      <AppAppBar toggleDrawer={handleDrawerToggle} drawerOpen={drawerOpen} />
      
      {/* Profile Modal - loaded but hidden until triggered */}
      <ProfileModal />
      
      {/* Main content area with chat drawer and window */}
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          height: `calc(100vh - 64px)`,
          pt: "64px",
          position: "relative",
          width: "100%",
        }}
      >
        {/* Left Pane: Chat Drawer */}
        <Box
          component="aside"
          sx={{
            position: isMobile ? "fixed" : "relative",
            zIndex: isMobile ? theme.zIndex.drawer : 0,
            width: isMobile ? "85%" : 320,
            maxWidth: isMobile ? 320 : "none",
            height: "100%",
            transform: isMobile ? 
              `translateX(${drawerOpen ? "0%" : "-100%"})` : 
              "none",
            transition: "transform 0.3s ease",
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.95)' : 'background.paper',
            boxShadow: isMobile ? 'var(--shadow-md)' : 'none',
          }}
        >
          <ChatDrawer onNewChat={handleNewChat} />
        </Box>

        {/* Right Pane: Chat Window */}
        <Box
          component="main"
          role="main"
          aria-label="Chat messages"
          sx={{
            flexGrow: 1,
            display: "flex",
            position: "relative",
            height: "100%",
            width: isMobile ? "100%" : `calc(100% - 320px)`,
            transition: "width 0.3s ease, margin-left 0.3s ease",
          }}
        >
          <ChatWindow key={chatKey} isNewChat={isNewChat} />
        </Box>
        
        {/* Backdrop overlay when drawer is open on mobile */}
        {isMobile && drawerOpen && (
          <Box
            onClick={handleDrawerToggle}
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              bgcolor: "rgba(0, 0, 0, 0.5)",
              zIndex: theme.zIndex.drawer - 1,
              transition: "opacity 0.3s ease",
            }}
          />
        )}
      </Box>
    </Box>
  );
}