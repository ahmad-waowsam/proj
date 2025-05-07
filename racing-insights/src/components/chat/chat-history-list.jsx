import React from "react";
import { Box, Typography, useTheme, Tooltip } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

export default function ChatHistoryList({ title, sessions = [] }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { threadId } = useParams();
  
  const handleChatItemClick = (session) => {
    if (!session.threadId) {
      console.warn("No thread ID found for session:", session);
      return;
    }
    
    // Navigate to the chat page with the thread ID
    navigate(`/chat/${session.threadId}`, { 
      state: { 
        chatData: session 
      } 
    });
    
    // Dispatch an event to close the drawer on mobile
    window.dispatchEvent(new CustomEvent('close-chat-drawer'));
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Section Title */}
      <Typography 
        variant="subtitle2" 
        sx={{ 
          px: 3,
          py: 1.5,
          color: "text.secondary",
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </Typography>
      
      {/* Chat History Items */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        // Remove any extra space between items
        '& > div + div': {
          mt: 0.5, // Consistent small gap between items
        }
      }}>
        {sessions.map((session) => {
          const isSelected = session.threadId === threadId;
          
          return (
            <Box
              key={session.id}
              onClick={() => handleChatItemClick(session)}
              sx={{
                position: "relative",
                px: 3,
                py: 1.5, // More consistent padding
                cursor: "pointer",
                transition: "all 0.15s ease",
                borderLeft: isSelected ? '3px solid' : '3px solid transparent',
                borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                bgcolor: isSelected 
                  ? theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.03)'
                  : 'transparent',
                "&:hover": {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.03)',
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "-2px",
                },
              }}
              component="button"
              tabIndex={0}
              aria-selected={isSelected}
              role="option"
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                {/* Chat Icon */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    bgcolor: isSelected
                      ? 'primary.main'
                      : theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.04)',
                    color: isSelected 
                      ? theme.palette.mode === 'dark' 
                        ? 'primary.contrastText' 
                        : 'white'
                      : 'text.secondary',
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                >
                  <ChatBubbleOutlineIcon 
                    sx={{ fontSize: 18, opacity: isSelected ? 1 : 0.7 }}
                  />
                </Box>

                {/* Chat Text Content */}
                <Box sx={{ flex: 1, overflow: "hidden" }}>
                  <Tooltip title={session.chatTitle} placement="top" arrow>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: "0.9rem",
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected 
                          ? "text.primary" 
                          : "text.secondary",
                        transition: "color 0.2s ease",
                        lineHeight: 1.3,
                      }}
                    >
                      {session.chatTitle}
                    </Typography>
                  </Tooltip>
                  
                  <Box 
                    sx={{ 
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.tertiary",
                        fontSize: "0.75rem",
                      }}
                    >
                      {session.time}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

