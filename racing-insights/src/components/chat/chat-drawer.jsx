import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  InputBase, 
  IconButton, 
  Collapse, 
  CircularProgress,
  Button
} from "@mui/material";
import ChatFilledIcon from "../../assets/icons/chat-filled.svg";
import ChatHistoryList from "./chat-history-list";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import HistoryIcon from '@mui/icons-material/History';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Replacing the missing SVG with Material UI icon
import { getChatHistory } from "../../api/chat";

export default function ChatDrawer({ onNewChat }) {
  const theme = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory, setChatHistory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchChatHistory();
    
    // Set up an event listener to refresh chat history when needed
    window.addEventListener('refresh-chat-history', fetchChatHistory);
    return () => window.removeEventListener('refresh-chat-history', fetchChatHistory);
  }, []);
  
  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get user email from localStorage for user-specific history
      let userKey = null;
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsedData = JSON.parse(userData);
        userKey = parsedData.email;
      } else {
        // Fallback to email directly
        userKey = localStorage.getItem("user_email");
      }
      
      // If no user key is found, set appropriate error message
      if (!userKey) {
        setError("Authentication required. Please log in to access chat history.");
        setChatHistory({});
        return;
      }
      
      // Call the API with explicit user key
      const response = await getChatHistory(null, userKey);
      
      // Check if we have history data in the expected format
      if (response && Array.isArray(response) && response.length > 0) {
        // Process the history data and categorize it
        const categorizedHistory = categorizeChatHistory(response);
        setChatHistory(categorizedHistory);
      } else if (response && response.history && Array.isArray(response.history) && response.history.length > 0) {
        // Handle API response with history property
        const categorizedHistory = categorizeChatHistory(response.history);
        setChatHistory(categorizedHistory);
      } else {
        setChatHistory({});
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
      if (err.message === "Authentication required. Please log in to continue.") {
        setError("Authentication required to view chat history");
      } else {
        setError("Failed to load chat history");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Categorize chat history into TODAY, YESTERDAY, and PREVIOUS
  const categorizeChatHistory = (history) => {
    if (!Array.isArray(history) || history.length === 0) {
      return {};
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates for comparison
    const todayDate = today.toDateString();
    const yesterdayDate = yesterday.toDateString();
    
    // Group chats by date
    const categorized = {
      TODAY: [],
      YESTERDAY: [],
      PREVIOUS: []
    };
    
    history.forEach((chat, index) => {
      try {
        // Check if the chat object has the required properties
        if (!chat || !chat.created_at || !chat.query) {
          return; // Skip this item
        }
        
        // Try to parse created_at in different formats
        let chatDate;
        try {
          chatDate = new Date(chat.created_at);
          // Check if date is valid
          if (isNaN(chatDate.getTime())) {
            chatDate = new Date(); // Use current date as fallback
          }
        } catch (e) {
          chatDate = new Date(); // Use current date as fallback
        }
        
        const chatDateString = chatDate.toDateString();
        const timeString = chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Extract chat title safely from the query
        const chatTitle = !chat.query ? "No title" : 
                          chat.query.length > 30 ? chat.query.substring(0, 30) + '...' : 
                          chat.query;
        
        // Format the chat entry with all required properties
        const chatEntry = {
          id: chat.id || `generated-id-${Date.now()}-${index}`,
          threadId: chat.thread_id || "", // Required for navigation
          userKey: chat.user_key || "",
          chatTitle: chatTitle,
          status: "Completed",
          time: timeString, // Time of the chat
          query: chat.query || "No query provided",
          response: chat.response || "No response available",
          createdAt: chatDate // Store the actual date for display
        };
        
        // Categorize based on date
        if (chatDateString === todayDate) {
          categorized.TODAY.push(chatEntry);
        } else if (chatDateString === yesterdayDate) {
          categorized.YESTERDAY.push(chatEntry);
        } else {
          const formattedDate = chatDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
          chatEntry.time = formattedDate;
          categorized.PREVIOUS.push(chatEntry);
        }
      } catch (error) {
        // Continue with the next item
      }
    });
    
    // Remove empty categories
    Object.keys(categorized).forEach(key => {
      if (categorized[key].length === 0) {
        delete categorized[key];
      }
    });
    
    return categorized;
  };
  
  // Filter chat history based on search query
  const filteredHistory = Object.entries(chatHistory).reduce((acc, [period, sessions]) => {
    if (!searchQuery) {
      acc[period] = sessions;
    } else {
      const filtered = sessions.filter(session => 
        session.chatTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[period] = filtered;
      }
    }
    return acc;
  }, {});

  // Toggle search visibility
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Search input handler
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {/* Header with title and action buttons */}
      <Box 
        sx={{ 
          px: 3, 
          pt: 2.5, 
          pb: 2,
          display: "flex", 
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider"
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ fontWeight: 600, fontSize: "1.125rem" }}
        >
          Chat History
        </Typography>
      </Box>
      
      {/* New Chat and Search Controls */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onNewChat}
          startIcon={<AddIcon />}
          size="large"
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            py: 1.25,
            mb: 2,
            fontWeight: 500,
            '&:hover': {
              bgcolor: "primary.dark",
            },
            borderRadius: 2,
          }}
        >
          New Chat
        </Button>
        
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              width: '100%',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: 3,
              px: 2,
              py: showSearch ? 1.25 : 1.25,
              gap: 1,
              cursor: searchQuery ? 'text' : 'pointer',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              },
            }}
            onClick={() => !showSearch && toggleSearch()}
          >
            <SearchIcon fontSize="small" color="action" />
            
            <InputBase
              placeholder="Search chats..."
              value={searchQuery}
              onChange={handleSearchChange}
              fullWidth
              sx={{
                fontSize: '0.95rem',
                '& input': {
                  padding: 0,
                  transition: 'opacity 0.2s ease',
                  opacity: showSearch ? 1 : 0,
                },
                visibility: showSearch ? 'visible' : 'hidden',
                transition: 'all 0.2s ease',
              }}
            />
            
            {!showSearch && !searchQuery && (
              <Typography
                sx={{
                  color: 'text.secondary',
                  position: 'absolute',
                  left: 40,
                  pointerEvents: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Search chats...
              </Typography>
            )}
            
            {(showSearch || searchQuery) && (
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (searchQuery) {
                    handleClearSearch();
                  } else {
                    toggleSearch();
                  }
                }}
                sx={{ p: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      {/* Scrollable container for chat history lists */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 0,
          py: 0,
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
        role="navigation"
        aria-label="Chat history"
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={fetchChatHistory}
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          </Box>
        ) : Object.keys(filteredHistory).length === 0 ? (
          <Box 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'calc(100% - 100px)',
              opacity: 0.8
            }}
          >
            {searchQuery ? (
              <>
                <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
                <Typography sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>
                  No matches found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try different search terms
                </Typography>
              </>
            ) : (
              <>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
                <Typography sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>
                  No chat history yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start a new chat to begin
                </Typography>
              </>
            )}
          </Box>
        ) : (
          Object.entries(filteredHistory).map(([period, sessions]) => (
            <ChatHistoryList key={period} title={period} sessions={sessions} />
          ))
        )}
      </Box>
    </Box>
  );
}
