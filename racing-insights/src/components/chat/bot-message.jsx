import React, { useState } from "react";
import { Box, Paper, Avatar, Typography, IconButton, useTheme, CircularProgress } from "@mui/material";
import ReactMarkdown from "react-markdown";
import MessageIcon from "../../assets/icons/message-icon.svg";
import BlackThumbsupIcon from "../../assets/icons/black-thumbs-up.svg";
import BlackThumbsdownIcon from "../../assets/icons/black-thumbs-down.svg";
import Copy from "../../assets/icons/copy.svg";
import Speaker from "../../assets/icons/speaker.svg";

export default function BotMessage({ message, time, user, highlight, highlightMessage, isLoading }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakText = () => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(message);
      if (speaking) {
        window.speechSynthesis.cancel();
      } else {
        window.speechSynthesis.speak(speech);
        speech.onend = () => setSpeaking(false);
      }
      setSpeaking(!speaking);
    }
  };
  
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        width: "100%",
        mb: 2,
        position: "relative",
        animation: "fadeIn 0.3s ease-in-out",
        "@keyframes fadeIn": {
          "0%": { opacity: 0, transform: "translateY(5px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9F9F9',
          borderRadius: "12px 12px 12px 0px",
          boxShadow: "none",
          color: "text.primary",
          maxWidth: "80%",
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          position: "relative",
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Avatar 
              src={MessageIcon} 
              alt="AI" 
              sx={{ 
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : 'primary.light',
                padding: "4px",
                filter: theme.palette.mode === 'dark' ? 'brightness(1.5)' : 'none',
              }} 
            />
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
              }}
            >
              {user}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "text.secondary",
                ml: 'auto'
              }}
            >
              {time}
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1 }}>
              <CircularProgress size={16} sx={{ color: theme.palette.primary.main }} />
              <Typography sx={{ fontStyle: "italic", color: "text.secondary", fontSize: "14px" }}>
                Thinking...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ fontSize: "14px", lineHeight: 1.6 }}>
              {/* Render the markdown message using react-markdown */}
              <ReactMarkdown
                children={message}
                components={{
                  // Use Typography for rendering paragraphs from markdown
                  p: ({ node, ...props }) => (
                    <Typography
                      component="span"
                      sx={{
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "break-word",
                        display: "block",
                        mb: 2,
                        lineHeight: 1.6,
                        fontSize: "14px",
                      }}
                      {...props}
                    />
                  ),
                  // Style headings
                  h1: ({ node, ...props }) => (
                    <Typography
                      variant="h5"
                      component="h1"
                      sx={{ fontWeight: 600, mb: 2, mt: 2, fontSize: "18px" }}
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ fontWeight: 600, mb: 2, mt: 2, fontSize: "16px" }}
                      {...props}
                    />
                  ),
                  // Style lists
                  ul: ({ node, ...props }) => (
                    <Box component="ul" sx={{ pl: 3, mb: 2 }} {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <Box component="ol" sx={{ pl: 3, mb: 2 }} {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <Box component="li" sx={{ mb: 1, fontSize: "14px" }} {...props} />
                  ),
                  // Style code blocks
                  code: ({ node, inline, className, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    
                    return inline ? (
                      <Box component="code" sx={{ 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        p: 0.5,
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.85em',
                      }} {...props} />
                    ) : (
                      <Box sx={{ position: 'relative' }}>
                        {language && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                              fontFamily: 'monospace',
                              fontSize: '0.7em',
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                              px: 1,
                              py: 0.5,
                              borderRadius: '4px',
                            }}
                          >
                            {language}
                          </Typography>
                        )}
                        <Box component="pre" sx={{ 
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.03)',
                          p: 2,
                          borderRadius: '8px',
                          overflowX: 'auto',
                          fontFamily: 'monospace',
                          fontSize: '0.85em',
                          mb: 2,
                          border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                        }} {...props} />
                      </Box>
                    );
                  },
                  // Style tables
                  table: ({ node, ...props }) => (
                    <Box 
                      component="table" 
                      sx={{ 
                        borderCollapse: 'collapse', 
                        width: '100%',
                        mb: 2,
                        fontSize: '0.9em',
                      }} 
                      {...props} 
                    />
                  ),
                  thead: ({ node, ...props }) => (
                    <Box 
                      component="thead" 
                      sx={{ 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      }} 
                      {...props} 
                    />
                  ),
                  th: ({ node, ...props }) => (
                    <Box 
                      component="th" 
                      sx={{ 
                        p: 1,
                        borderBottom: 1,
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        textAlign: 'left',
                      }} 
                      {...props} 
                    />
                  ),
                  td: ({ node, ...props }) => (
                    <Box 
                      component="td" 
                      sx={{ 
                        p: 1,
                        borderBottom: 1,
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      }} 
                      {...props} 
                    />
                  ),
                }}
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Utility buttons for the message */}
      {!isLoading && (
        <Box 
          sx={{ 
            display: "flex", 
            gap: 1, 
            mt: 1, 
            ml: 1,
            opacity: 0,
            transition: "opacity 0.2s ease",
            "&:hover": {
              opacity: 1
            },
          }}
          className="message-actions"
        >
          <Box 
            sx={{ 
              position: "relative",
              display: "flex",
              alignItems: "center"
            }}
          >
            <IconButton 
              size="small" 
              onClick={handleCopyText}
              sx={{ 
                color: "text.secondary",
                p: 0.5,
                "&:hover": {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }
              }}
            >
              <img 
                src={Copy} 
                alt="Copy"
                style={{ 
                  filter: theme.palette.mode === 'dark' ? 'brightness(10)' : 'none',
                  width: "16px",
                  height: "16px"
                }}  
              />
            </IconButton>
            {copied && (
              <Box
                sx={{
                  position: "absolute",
                  left: 30,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
                  Copied!
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box 
            sx={{ 
              position: "relative",
              display: "flex",
              alignItems: "center"
            }}
          >
            <IconButton 
              size="small" 
              onClick={handleSpeakText}
              sx={{ 
                color: "text.secondary",
                p: 0.5,
                backgroundColor: speaking ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') : 'transparent',
                "&:hover": {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }
              }}
            >
              <img 
                src={Speaker} 
                alt="Speaker" 
                style={{ 
                  filter: theme.palette.mode === 'dark' ? 'brightness(10)' : 'none',
                  width: "16px",
                  height: "16px"
                }} 
              />
            </IconButton>
            {speaking && (
              <Box
                sx={{
                  position: "absolute",
                  left: 30,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
                  Speaking...
                </Typography>
              </Box>
            )}
          </Box>
          
          <IconButton 
            size="small" 
            sx={{ 
              color: "text.secondary",
              p: 0.5,
              "&:hover": {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <img 
              src={BlackThumbsupIcon} 
              alt="Thumbs Up" 
              style={{ 
                filter: theme.palette.mode === 'dark' ? 'brightness(10)' : 'none',
                width: "16px",
                height: "16px"
              }} 
            />
          </IconButton>
          
          <IconButton 
            size="small" 
            sx={{ 
              color: "text.secondary",
              p: 0.5,
              "&:hover": {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <img 
              src={BlackThumbsdownIcon} 
              alt="Thumbs Down"
              style={{ 
                filter: theme.palette.mode === 'dark' ? 'brightness(10)' : 'none',
                width: "16px",
                height: "16px"
              }}  
            />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}