import React from "react";
import { Box, Typography, Paper, useTheme, Avatar, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChatIcon from '@mui/icons-material/Chat';

export default function ChatHistoryList({ title, sessions = [] }) {
  const theme = useTheme();
  const navigate = useNavigate();
  
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
  
  // Function to extract message preview
  const getMessagePreview = (message, maxLength = 60) => {
    if (!message) return "No message content";
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };
  
  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Typography 
        variant="subtitle2" 
        color="text.secondary" 
        sx={{ 
          mb: 1.5,
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'uppercase'
        }}
      >
        {title}
      </Typography>
      
      {sessions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 1 }}>
          No chats found.
        </Typography>
      ) : (
        sessions.map((session, i) => (
          <Paper
            key={session.id || i}
            elevation={0}
            onClick={() => handleChatItemClick(session)}
            sx={{
              px: 2, 
              py: 1.5,
              mb: 1,
              borderRadius: '12px',
              backgroundColor: '#EEEEEE',
              '&:hover': { 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0',
              },
              cursor: 'pointer',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Avatar 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    bgcolor: theme.palette.primary.main,
                    opacity: 0.8,
                    fontSize: '0.8rem'
                  }}
                >
                  <ChatIcon sx={{ fontSize: '16px' }} />
                </Avatar>
                <Tooltip title={session.chatTitle} placement="top">
                  <Typography 
                    noWrap 
                    sx={{ 
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {session.chatTitle}
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
            
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'block',
                mb: 0.5,
                ml: 4,
                fontSize: 11,
                fontWeight: 400 
              }}
            >
              {session.time}
            </Typography>
          </Paper>
        ))
      )}
    </Box>
  );
}

