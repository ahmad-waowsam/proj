import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, InputBase, Paper, Typography, useTheme, CircularProgress } from "@mui/material";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import SendIcon from "../../assets/icons/send-icon.svg";
import HandWaveIcon from "../../assets/icons/hand-wave.svg";
import UserMessage from "./user-message";
import BotMessage from "./bot-message";
import { sendChatMessage, getChatHistory } from "../../api/chat";

// Suggestion button component for cleaner code
const SuggestionButton = ({ text, onClick }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        px: 3,
        py: 1.5,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : "#F8F9FA",
        borderRadius: "12px",
        color: theme.palette.text.primary,
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        "&:hover": {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : "#F0F1F3",
        },
        boxShadow: "none",
        border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        minWidth: '190px',
        textAlign: 'center',
      }}
    >
      {text}
    </Paper>
  );
};

export default function ChatWindow({ isNewChat = false }) {
  const [message, setMessage] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const theme = useTheme();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

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
    ["Today's Racing Predictions", "2024 Racing Statistics"],
    ["Recent Winners", "Horse Performance History"]
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when conversations change
  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

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

    // Add loading message to show the bot is responding
    const loadingMsgId = `bot-${Date.now()}`;
    const loadingMessage = {
      id: loadingMsgId,
      user: "Racing Insights AI",
      message: "Thinking...",
      time: new Date(),
      isUser: false,
      isLoading: true,
    };

    setConversations((prevConversations) => [
      ...prevConversations,
      loadingMessage,
    ]);

    try {
      // Call the API with the current thread ID
      const response = await sendChatMessage(message, currentThreadId);

      // Create bot message with the structure expected by the UI components
      const botMessage = {
        id: loadingMsgId, // Use same ID to replace the loading message
        user: "Racing Insights AI",
        message: response.response,
        time: new Date(),
        isUser: false,
        isLoading: false,
      };

      setConversations((prevConversations) =>
        prevConversations.map((msg) =>
          msg.id === loadingMsgId ? botMessage : msg
        )
      );

      // Update URL if needed
      if (!params.threadId || params.threadId !== currentThreadId) {
        navigate(`/chat/${currentThreadId}`, { replace: true });
      }

      // Dispatch an event to refresh chat history in the sidebar
      window.dispatchEvent(new CustomEvent('refresh-chat-history'));
    } catch (error) {
      console.error("Error sending message:", error);

      // Replace loading message with error message
      const errorMessage = {
        id: loadingMsgId, // Use same ID to replace the loading message
        user: "Racing Insights AI",
        message: "Sorry, I couldn't process your request. Please try again.",
        time: new Date(),
        isUser: false,
        isLoading: false,
      };

      setConversations((prevConversations) =>
        prevConversations.map((msg) =>
          msg.id === loadingMsgId ? errorMessage : msg
        )
      );
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

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
      }}
    >
      {/* CHAT PANE */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          borderRadius: { xs: 0, md: '12px' },
          overflow: "hidden",
          bgcolor: "background.default",
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: theme.palette.mode === 'dark' ? 'none' : '0px 2px 10px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Chat Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            pt: 2,
            pb: 2,
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
              }}
            >
              <CircularProgress
                size={32}
                sx={{
                  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
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
              }}
            >
              <Box
                component="img"
                src={HandWaveIcon}
                alt="Wave"
                sx={{
                  width: 48,
                  height: 48,
                  filter: theme.palette.mode === 'dark' ? 'brightness(10)' : 'none',
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontSize: "24px",
                  color: "text.primary",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                What can I help you with?
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: "100%",
                  maxWidth: "600px",
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
                        onClick={() => handleSuggestionClick(suggestion)}
                      />
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: 2,
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : "#e0e0e0",
                  borderRadius: "8px",
                },
              }}
            >
              {conversations.map((conv) =>
                conv.isUser ? (
                  <UserMessage
                    key={conv.id}
                    user={conv.user}
                    message={conv.message}
                    time={formatTime(conv.time)}
                  />
                ) : (
                  <BotMessage
                    key={conv.id}
                    user={conv.user}
                    message={conv.message}
                    time={formatTime(conv.time)}
                    highlight={conv.highlight}
                    highlightMessage={conv.highlightMessage}
                    isLoading={conv.isLoading}
                  />
                )
              )}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>

        {/* Input Area - Fixed at bottom */}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            pt: 2,
            pb: 3,
            px: 2,
            backgroundColor: "background.default",
            borderTop: "1px solid",
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'divider',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              p: "10px 16px",
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : "#F4F4F4",
              borderRadius: "12px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            }}
          >
            <InputBase
              inputRef={inputRef}
              multiline
              maxRows={4}
              sx={{
                flex: 1,
                fontSize: "14px",
                color: theme.palette.text.primary,
                "& input::placeholder": {
                  color: theme.palette.text.secondary,
                  opacity: 0.7,
                },
                "& .MuiInputBase-input": {
                  maxHeight: "100px",
                  overflow: "auto",
                }
              }}
              placeholder="Ask about racing insights..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <IconButton
              type="button"
              sx={{
                p: "8px",
                color: message.trim() ? "primary.main" : "text.disabled",
                backgroundColor: message.trim()
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(239, 189, 147, 0.2)'
                    : 'rgba(239, 189, 147, 0.1)'
                  : 'transparent',
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: message.trim()
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(239, 189, 147, 0.3)'
                      : 'rgba(239, 189, 147, 0.2)'
                    : 'transparent',
                },
              }}
              aria-label="send"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              <img
                src={SendIcon}
                alt="send"
                style={{
                  filter: theme.palette.mode === 'dark' && message.trim() ? 'brightness(1.5)' : 'none',
                  width: '40px',
                  height: '40px',
                }}
              />
            </IconButton>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}