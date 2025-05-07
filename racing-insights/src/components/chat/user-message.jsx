import React from "react";
import { Box, Paper, Avatar, Typography, IconButton, useTheme, Tooltip } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonIcon from '@mui/icons-material/Person';

export default function UserMessage({ message, time, user, isConsecutive = false }) {
  const theme = useTheme();
  const [copied, setCopied] = React.useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      className="message-container user-message-container"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        width: "100%",
        // Fixed spacing for consistent layout regardless of message type
        mb: 2,
        mt: isConsecutive ? 0.5 : 1.5, 
        position: "relative",
        animation: "fadeIn 0.3s ease-in-out",
        "@keyframes fadeIn": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* User Avatar and Name - only show for first message in a sequence */}
      {!isConsecutive && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            mb: 1,
            width: "100%",
            px: 1, // Add padding for alignment
          }}
        >
          <Typography
            sx={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "text.primary",
              mr: 1,
            }}
          >
            {user}
          </Typography>
          <Avatar
            sx={{ 
              width: 24, 
              height: 24, 
              bgcolor: "var(--bg-chat-user)",
              color: "var(--text-on-accent)"
            }}
          >
            <PersonIcon sx={{ fontSize: 16 }} />
          </Avatar>
        </Box>
      )}

      {/* Message with Time */}
      <Box sx={{ 
        maxWidth: "85%", 
        position: "relative",
        mr: 0.5, // Add right margin for better alignment
      }}>
        <Paper
          elevation={0}
          sx={{
            py: 1.5,
            px: 2,
            backgroundColor: "var(--bg-chat-user)",
            borderRadius: isConsecutive ? "12px 12px 0 12px" : "12px 0 12px 12px",
            color: theme.palette.mode === 'dark' ? "text.primary" : "#000",
            wordBreak: "break-word",
            transition: "all 0.2s",
          }}
        >
          <Typography
            component="div"
            sx={{
              fontSize: "0.95rem",
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
            }}
          >
            {message}
          </Typography>
        </Paper>

        {/* Time and Copy Button - Always visible but subtle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 0.5,
            px: 0.5, // Add padding for alignment
            opacity: 0.7, // Always slightly visible
            transition: "opacity 0.2s ease",
            "&:hover": {
              opacity: 1,
            },
            height: "24px", // Fixed height to prevent layout shifts
          }}
          className="message-actions"
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.tertiary",
              fontSize: "0.75rem",
              ml: 0.5, // Reduced margin
            }}
          >
            {time}
          </Typography>

          <Tooltip title={copied ? "Copied!" : "Copy"} placement="left">
            <IconButton
              onClick={handleCopyText}
              size="small"
              sx={{
                color: "text.secondary",
                p: 0.5,
                "&:hover": {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}