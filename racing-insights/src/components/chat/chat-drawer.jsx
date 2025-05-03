import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme, InputBase, IconButton, Collapse, CircularProgress } from "@mui/material";
import AppButton from "../common/app-button";
import ChatFilledIcon from "../../assets/icons/chat-filled.svg";
import ChatHistoryList from "./chat-history-list";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
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
      
      console.log("Chat History API Response:", response);
      
      // Check if we have history data in the expected format
      if (response && Array.isArray(response) && response.length > 0) {
        // Process the history data and categorize it
        const categorizedHistory = categorizeChatHistory(response);
        console.log("Categorized History:", categorizedHistory);
        setChatHistory(categorizedHistory);
      } else if (response && response.history && Array.isArray(response.history) && response.history.length > 0) {
        // Handle API response with history property
        const categorizedHistory = categorizeChatHistory(response.history);
        console.log("Categorized History (from history property):", categorizedHistory);
        setChatHistory(categorizedHistory);
      } else {
        console.log("No chat history found in the response");
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
      console.log("No history data to categorize or invalid format");
      return {};
    }

    console.log("Starting categorization of", history.length, "history items");
    
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
        console.log(`Processing chat item ${index}:`, chat);
        
        // Check if the chat object has the required properties
        if (!chat || !chat.created_at || !chat.query) {
          console.warn(`Chat item ${index} is missing required properties:`, chat);
          return; // Skip this item
        }
        
        // Try to parse created_at in different formats
        let chatDate;
        try {
          chatDate = new Date(chat.created_at);
          // Check if date is valid
          if (isNaN(chatDate.getTime())) {
            console.warn(`Invalid date format for chat ${index}:`, chat.created_at);
            chatDate = new Date(); // Use current date as fallback
          }
        } catch (e) {
          console.error(`Error parsing date for chat ${index}:`, e);
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
          time: timeString,
          query: chat.query || "No query provided",
          response: chat.response || "No response available"
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
        console.error(`Error processing chat item ${index}:`, error, chat);
        // Continue with the next item
      }
    });
    
    // Remove empty categories
    Object.keys(categorized).forEach(key => {
      if (categorized[key].length === 0) {
        delete categorized[key];
      } else {
        console.log(`${key} category has ${categorized[key].length} items`);
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

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        backgroundColor: "background.default",
        border: `1px solid`,
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'secondary.main',
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AppButton 
            onClick={onNewChat}
            sx={{ 
              flex: 1,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(239, 189, 147, 0.2)' : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(239, 189, 147, 0.3)' : theme.palette.primary.dark,
              }
            }}
          >
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <img 
                src={ChatFilledIcon} 
                alt="New Chat"
                style={{ 
                  filter: theme.palette.mode === 'dark' ? 'brightness(10)' : 'none'
                }} 
              />
              <Typography sx={{ fontWeight: 500 }}>New Chat</Typography>
            </Box>
          </AppButton>
          
          <IconButton 
            onClick={toggleSearch}
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.secondary.main,
              borderRadius: 2,
              width: 40,
              height: 40,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
              }
            }}
          >
            {showSearch ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
          </IconButton>
        </Box>
        
        <Collapse in={showSearch} timeout="auto">
          <InputBase
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            fullWidth
            sx={{
              mb: 2,
              px: 1.5,
              py: 1,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'divider',
              borderRadius: '12px',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'background.paper',
              '& input': {
                color: 'text.primary',
              },
              '& input::placeholder': {
                color: 'text.secondary',
                opacity: 0.7,
              },
            }}
          />
        </Collapse>
      </Box>

      {/* Scrollable container for chat history lists */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : "chatTitle.main",
            borderRadius: "8px",
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Typography 
              color="primary" 
              sx={{ mt: 1, cursor: 'pointer', textDecoration: 'underline' }} 
              onClick={fetchChatHistory}
            >
              Retry
            </Typography>
          </Box>
        ) : Object.keys(filteredHistory).length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchQuery ? "No chats match your search." : "No chat history found."}
            </Typography>
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
