import React, { useState, useEffect, useRef } from "react";
import { 
  Box, 
  IconButton, 
  InputBase, 
  Paper, 
  Typography, 
  useTheme, 
  CircularProgress, 
  Tooltip, 
  Button,
  useMediaQuery
} from "@mui/material";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import SendIcon from '@mui/icons-material/Send';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import UserMessage from "./user-message";
import BotMessage from "./bot-message";
import { sendChatMessage, getChatHistory } from "../../api/chat";

// Suggestion button component for cleaner code
const SuggestionButton = ({ text, onClick }) => {
  const theme = useTheme();

  return (
    <Button
      onClick={() => onClick(text)}
      sx={{
        px: 3,
        py: 1.5,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        borderRadius: "12px",
        color: "text.primary",
        border: '1px solid',
        borderColor: 'divider',
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        "&:hover": {
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
          boxShadow: 'var(--shadow-sm)',
        },
        minWidth: '200px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
      variant="text"
    >
      {text}
    </Button>
  );
};

// Typing indicator component
const TypingIndicator = () => {
  return (
    <Box 
      className="typing-indicator"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 1.5,
        py: 0.8,
        bgcolor: theme => theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.03)',
        borderRadius: 2,
        width: 'fit-content',
        mb: 1
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        Racing Insights AI is typing
        <span>.</span><span>.</span><span>.</span>
      </Typography>
    </Box>
  );
};

export default function ChatWindow({ isNewChat = false }) {
  const [message, setMessage] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [textareaRows, setTextareaRows] = useState(1);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const theme = useTheme();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Add a ref to track if this is the first render (page load)
  const isFirstRender = useRef(true);

  // Generate a unique thread ID for new chats
  const generateNewThreadId = () => {
    const uniqueId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('user_thread_id', uniqueId);
    return uniqueId;
  };

  // Handle new chat requests by generating a new thread ID
  useEffect(() => {
    if (isNewChat) {
      const newThreadId = generateNewThreadId();
      setThreadId(newThreadId);
      setConversations([]);
      setShowWelcome(true);
      
      // Update URL to reflect the new thread ID
      navigate(`/chat/${newThreadId}`, { replace: true });
    }
  }, [isNewChat, navigate]);

  // Handle page reload - always generate new thread ID when the page is reloaded
  useEffect(() => {
    // Create a session storage key for this session
    const pageReloadKey = 'page_load_timestamp';
    
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Get the last load timestamp
      const lastLoadTime = sessionStorage.getItem(pageReloadKey);
      const currentTime = Date.now().toString();
      
      // Store current timestamp for next reload check
      sessionStorage.setItem(pageReloadKey, currentTime);
      
      // Always generate a new thread ID on page reload, regardless of URL params
      // This ensures a fresh conversation starts on each page load
      const newThreadId = generateNewThreadId();
      setThreadId(newThreadId);
      setConversations([]);
      setShowWelcome(true);
        
      // Update URL to reflect the new thread ID
      navigate(`/chat/${newThreadId}`, { replace: true });
    }
  }, [navigate]);

  // Only generate a unique thread ID if one doesn't exist in localStorage
  useEffect(() => {
    if (!localStorage.getItem('user_thread_id')) {
      const uniqueId = generateNewThreadId();
      setThreadId(uniqueId);
    }
  }, []);

  // Suggestions data - more focused and relevant
  const suggestionRows = [
    ["Today's Racing Predictions", "Upcoming Race Analysis"],
    ["Race Results Summary", "Horse Performance Stats"]
  ];

  // Load chat history if a thread ID is provided
  useEffect(() => {
    // Skip loading history if this is a new chat
    if (isNewChat) return;
    
    // Skip history load during first render if we're in reload mode
    if (isFirstRender.current) return;
    
    // Check if we have a thread ID from the URL params
    if (params.threadId) {
      setThreadId(params.threadId);
      loadChatHistory(params.threadId);
    }
    // Check if we have chat data from navigation state
    else if (location.state?.chatData) {
      const chatData = location.state.chatData;
      setThreadId(chatData.threadId);

      // If we have the full conversation already in state
      if (chatData.query && chatData.response) {
        const formattedConversation = formatHistoryToConversation(chatData);
        setConversations(formattedConversation);
        setShowWelcome(false);
      } else {
        // Otherwise load the full history
        loadChatHistory(chatData.threadId);
      }
    } else {
      // If no thread ID provided, use the user's saved thread ID or default
      const userThreadId = localStorage.getItem('user_thread_id') || '';
      setThreadId(userThreadId);
      loadChatHistory(userThreadId);
    }
  }, [params.threadId, location.state, isNewChat]);

  const loadChatHistory = async (threadId) => {
    // Don't attempt to load history if threadId not provided
    if (!threadId) {
      setShowWelcome(true);
      return;
    }
    
    try {
      setIsLoading(true);
      const history = await getChatHistory(threadId);

      if (history && history.length > 0) {
        // Convert chat history to conversation format
        const formattedConversations = formatHistoryToConversations(history);
        setConversations(formattedConversations);
        setShowWelcome(false);

        // Store this thread ID as the current one
        localStorage.setItem('user_thread_id', threadId);

        // Update the URL to include the thread ID without triggering a reload
        if (!params.threadId) {
          navigate(`/chat/${threadId}`, { replace: true });
        }
      } else {
        console.log(`No history found for thread: ${threadId}`);
        setShowWelcome(true);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      setShowWelcome(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Format a single history item to conversation format
  const formatHistoryToConversation = (historyItem) => {
    const timestamp = new Date(historyItem.created_at || new Date());

    // Extract the response text from the response object structure
    let responseText = '';
    if (historyItem.response) {
      if (typeof historyItem.response === 'string') {
        responseText = historyItem.response;
      } else if (historyItem.response.response) {
        responseText = historyItem.response.response;
      }
    }

    return [
      {
        id: `user-${historyItem.id || Date.now()}`,
        user: "You",
        message: historyItem.query,
        time: timestamp,
        isUser: true
      },
      {
        id: `bot-${historyItem.id || Date.now() + 1}`,
        user: "Racing Insights AI",
        message: responseText,
        time: timestamp,
        isUser: false
      }
    ];
  };

  // Format chat history to conversation format, ensuring proper order
  const formatHistoryToConversations = (history) => {
    if (!Array.isArray(history)) return [];

    // Sort history to ensure messages are in chronological order
    const sortedHistory = [...history].sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    );

    // Start with empty array
    let formattedConversations = [];

    // Add each history item as a user and bot message pair
    sortedHistory.forEach(item => {
      const timestamp = new Date(item.created_at || new Date());
      
      // Extract the response text from the response object structure
      let responseText = '';
      if (item.response) {
        if (typeof item.response === 'string') {
          responseText = item.response;
        } else if (typeof item.response === 'object') {
          // Handle various response formats
          if (item.response.response) {
            responseText = item.response.response;
          } else if (item.response.text) {
            responseText = item.response.text;
          } else if (item.response.content) {
            responseText = item.response.content;
          } else {
            // Fallback: try to stringify the object
            try {
              responseText = JSON.stringify(item.response);
            } catch (e) {
              responseText = "Unable to display response";
            }
          }
        }
      }
      
      // Add user message
      formattedConversations.push({
        id: `user-${item.id || Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        user: "You",
        message: item.query,
        time: timestamp,
        isUser: true
      });
      
      // Add bot message
      formattedConversations.push({
        id: `bot-${item.id || Date.now() + 1}-${Math.random().toString(36).substring(2, 9)}`,
        user: "Racing Insights AI",
        message: responseText,
        time: timestamp,
        isUser: false
      });
    });

    return formattedConversations;
  };

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom when conversations change
  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  // Handle textarea height adjustment
  useEffect(() => {
    if (!message) {
      setTextareaRows(1);
      return;
    }
    
    // Count newlines (limited to 5 rows max)
    const lineCount = (message.match(/\n/g) || []).length + 1;
    setTextareaRows(Math.min(Math.max(1, lineCount), 5));
  }, [message]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Hide welcome screen when user sends a message
    if (showWelcome) {
      setShowWelcome(false);
    }

    // Get the current thread ID or generate a new one if empty
    let currentThreadId = threadId || localStorage.getItem('user_thread_id');
    if (!currentThreadId) {
      currentThreadId = generateNewThreadId();
      setThreadId(currentThreadId);
    }

    // Create user message with the structure expected by the UI components
    const userMessage = {
      id: `user-${Date.now()}`,
      user: "You",
      message: message,
      time: new Date(),
      isUser: true,
    };

    setConversations([...conversations, userMessage]);
    setMessage("");
    setTextareaRows(1);
    
    // Scroll immediately after user message
    setTimeout(() => scrollToBottom("instant"), 50);

    // Start typing indicator
    setIsTyping(true);

    try {
      // Call the API with the current thread ID
      const response = await sendChatMessage(message, currentThreadId);
      
      // Remove typing indicator
      setIsTyping(false);

      // Create bot message with the structure expected by the UI components
      const botMessage = {
        id: `bot-${Date.now()}`,
        user: "Racing Insights AI",
        message: response.response,
        time: new Date(),
        isUser: false,
      };

      setConversations(prev => [...prev, botMessage]);

      // Update URL if needed
      if (!params.threadId || params.threadId !== currentThreadId) {
        navigate(`/chat/${currentThreadId}`, { replace: true });
      }

      // Dispatch an event to refresh chat history in the sidebar
      window.dispatchEvent(new CustomEvent('refresh-chat-history'));
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);

      // Replace loading message with error message
      const errorMessage = {
        id: `bot-error-${Date.now()}`,
        user: "Racing Insights AI",
        message: "Sorry, I couldn't process your request. Please try again.",
        time: new Date(),
        isUser: false,
        isError: true,
      };

      setConversations(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setMessage(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const formatTime = (date) => {
    if (!date) return '';
    if (typeof date === "string") {
      try {
        date = new Date(date);
      } catch (e) {
        return '';
      }
    }

    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Extract the current chat's title
  const extractCurrentTitle = () => {
    if (!conversations.length) return "New Chat";
    
    // Find the first user message (should be at index 0)
    const firstUserMsg = conversations.find(c => c.isUser);
    if (!firstUserMsg) return "New Chat";
    
    // Truncate the message to use as title
    const title = firstUserMsg.message;
    return title.length > 28 ? `${title.substring(0, 25)}...` : title;
  };
  
  // Mobile back button handler
  const handleBack = () => {
    // Dispatch event to open the drawer on mobile
    window.dispatchEvent(new CustomEvent('open-chat-drawer'));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {/* Chat Window Header */}
      {threadId && conversations.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {isMobile && (
            <IconButton 
              onClick={handleBack} 
              size="small"
              sx={{ mr: 0.5 }}
            >
              <KeyboardArrowLeftIcon />
            </IconButton>
          )}
          
          <Typography 
            noWrap
            sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {extractCurrentTitle()}
          </Typography>
        </Box>
      )}

      {/* Chat Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          px: { xs: 2, sm: 4, md: 8, lg: 16 },
          py: 3,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : "rgba(0, 0, 0, 0.2)",
            borderRadius: "8px",
          },
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 300,
            }}
          >
            <CircularProgress
              size={32}
              sx={{
                color: "primary.main"
              }}
            />
            <Typography sx={{ mt: 2, color: "text.secondary" }}>
              Loading conversation...
            </Typography>
          </Box>
        ) : showWelcome ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
              px: 2,
              mx: "auto",
              width: "100%",
              maxWidth: "800px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 189, 147, 0.15)' : 'rgba(239, 189, 147, 0.1)',
                mb: 1,
              }}
            >
              <WavingHandIcon
                sx={{
                  fontSize: 32,
                  color: "primary.main",
                }}
              />
            </Box>
            
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: "1.5rem", md: "2rem" },
                color: "text.primary",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              How can I assist with racing insights today?
            </Typography>

            <Typography
              sx={{
                color: "text.secondary",
                textAlign: "center",
                maxWidth: "600px",
                mb: 2,
              }}
            >
              Ask about race predictions, statistics, horse performance, or try one of the examples below.
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
                maxWidth: { xs: "100%", sm: "85%", md: "700px" },
              }}
            >
              {/* Render suggestion rows */}
              {suggestionRows.map((row, rowIndex) => (
                <Box
                  key={rowIndex}
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                    flexWrap: "wrap"
                  }}
                >
                  {row.map((suggestion, index) => (
                    <SuggestionButton
                      key={`${rowIndex}-${index}`}
                      text={suggestion}
                      onClick={handleSuggestionClick}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <>
            {conversations.map((conv, index) => {
              // Check if this message is from the same sender as the previous one
              const prevMessage = index > 0 ? conversations[index - 1] : null;
              const isConsecutive = prevMessage && prevMessage.isUser === conv.isUser;
              
              return conv.isUser ? (
                <UserMessage
                  key={conv.id}
                  user={conv.user}
                  message={conv.message}
                  time={formatTime(conv.time)}
                  isConsecutive={isConsecutive}
                />
              ) : (
                <BotMessage
                  key={conv.id}
                  user={conv.user}
                  message={conv.message}
                  time={formatTime(conv.time)}
                  highlight={conv.highlight}
                  highlightMessage={conv.highlightMessage}
                  isError={conv.isError}
                  isConsecutive={isConsecutive}
                />
              );
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <Box sx={{ mt: 2, ml: 0.5 }}>
                <TypingIndicator />
              </Box>
            )}
            
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          width: "100%",
          backgroundColor: "background.default",
          zIndex: 1,
          py: 2,
          px: { xs: 2, sm: 4, md: 8, lg: 16 },
          borderTop: "1px solid",
          borderColor: "divider",
        }}
        className="safe-area-bottom"
      >
        <Box
          sx={{
            maxWidth: "800px",
            mx: "auto",
            width: "100%",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "flex-end",
              p: 1.5,
              paddingLeft: 2,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.03)',
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <InputBase
              inputRef={inputRef}
              multiline
              maxRows={5}
              sx={{
                flex: 1,
                fontSize: "0.95rem",
                lineHeight: 1.5,
                py: 0.5,
                "& .MuiInputBase-input": {
                  padding: 0,
                },
              }}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={textareaRows}
            />
            
            <Tooltip title="More options">
              <IconButton 
                size="small" 
                sx={{ 
                  color: "text.secondary",
                  mr: 0.5,
                }}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Send message">
              <IconButton
                onClick={handleSendMessage}
                disabled={!message.trim()}
                sx={{
                  ml: 0.5,
                  color: message.trim() ? "primary.main" : "text.disabled",
                  bgcolor: message.trim() 
                    ? theme.palette.mode === 'dark' 
                      ? 'rgba(239, 189, 147, 0.15)' 
                      : 'rgba(239, 189, 147, 0.1)'
                    : 'transparent',
                  '&:hover': {
                    bgcolor: message.trim() 
                      ? theme.palette.mode === 'dark' 
                        ? 'rgba(239, 189, 147, 0.25)' 
                        : 'rgba(239, 189, 147, 0.2)'
                      : 'transparent',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <SendIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Paper>
          
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mt: 1.5,
              opacity: 0.8,
            }}
          >
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem' }}
            >
              Press Enter to send, Shift+Enter for new line
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}