import React, { useState } from "react";
import AppAppBar from "../../components/common/app-appbar";
import ChatDrawer from "../../components/chat/chat-drawer";
import ProfileModal from "../../components/profile/profile-modal";
import { Box, IconButton, useTheme, useMediaQuery } from "@mui/material";
import ChatWindow from "../../components/chat/chat-window";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

export default function Chat() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [chatKey, setChatKey] = useState(0);
  const [isNewChat, setIsNewChat] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNewChat = () => {
    setIsNewChat(true);
    setChatKey(prevKey => prevKey + 1);
    // Reset isNewChat after a brief delay to ensure it's processed
    setTimeout(() => setIsNewChat(false), 100);
  };

  return (
    <Box
      sx={{
        backgroundColor: "background.default",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppAppBar />
      <ProfileModal />
      
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          height: "calc(100vh - 72px)",
          overflow: "hidden",
          pt: "72px",
          position: "relative",
        }}
      >
        {/* Mobile menu toggle button */}
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              position: "fixed",
              left: drawerOpen ? "auto" : "16px",
              right: drawerOpen ? "16px" : "auto",
              top: "84px",
              zIndex: 1300,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              width: 36,
              height: 36,
              "&:hover": {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              },
            }}
          >
            {drawerOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
          </IconButton>
        )}
        
        {/* Chat drawer - slide in/out on mobile */}
        <Box
          sx={{
            position: isMobile ? "fixed" : "static",
            left: 0,
            top: isMobile ? 72 : 0,
            height: "calc(100vh - 72px)",
            width: isMobile ? "85%" : "280px",
            maxWidth: isMobile ? "300px" : "none",
            transform: isMobile ? `translateX(${drawerOpen ? "0%" : "-100%"})` : "none",
            transition: "transform 0.3s ease-in-out",
            zIndex: 1200,
            boxShadow: isMobile ? "4px 0px 10px rgba(0, 0, 0, 0.1)" : "none",
            flexShrink: 0,
          }}
        >
          <ChatDrawer onNewChat={handleNewChat} />
        </Box>
        
        {/* Chat window container - with zero gap and full space utilization */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            position: "relative",
            width: isMobile ? "100%" : "calc(100% - 280px)", 
            marginLeft: isMobile ? 0 : 0, // Changed to 0 to avoid double offset
            transition: "margin-left 0.3s ease-in-out",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <ChatWindow key={chatKey} isNewChat={isNewChat} />
        </Box>
      </Box>
    </Box>
  );
}