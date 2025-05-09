import axios from "axios";

// Base API URL - change this to your production URL when deploying
const API_BASE_URL = "http://localhost:8006";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Authentication API calls
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User's email
 * @param {string} userData.username - User's username
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} - The API response with token
 */
export const signup = async (userData) => {
  try {
    const response = await apiClient.post("/signup", userData);
    // Store token in localStorage
    if (response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("user_email", userData.email);
    }
    return response.data;
  } catch (error) {
    console.error("Error during signup:", error);
    throw error;
  }
};

/**
 * Login an existing user
 * @param {string} username - User's email (used as username)
 * @param {string} password - User's password
 * @returns {Promise<Object>} - The API response with token
 */
export const login = async (username, password) => {
  try {
    // FastAPI OAuth2 endpoint expects form data as x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append("grant_type", "password");
    params.append("username", username);
    params.append("password", password);
    params.append("scope", "");
    const response = await apiClient.post("/login", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    
    // Store token in localStorage
    if (response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("user_email", username);
    }
    return response.data;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

/**
 * Get current user profile information
 * @returns {Promise<Object>} User data
 */
export const getCurrentUser = async () => {
  try {
    // Remove mock data condition to ensure we always call the API
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API response from getCurrentUser:', data); // Add logging to debug
    
    // Cache user data in localStorage for offline access
    localStorage.setItem('user_data', JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Try to get cached data if API call fails
    const cachedUserData = localStorage.getItem('user_data');
    if (cachedUserData) {
      try {
        return JSON.parse(cachedUserData);
      } catch (e) {
        console.error('Error parsing cached user data:', e);
      }
    }
    throw error;
  }
};

/**
 * Update user profile information
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (userData) => {
  try {
    // Using PUT method with the /users/me endpoint from main.py
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update user data: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Update cached user data
    const cachedUserData = localStorage.getItem('user_data');
    if (cachedUserData) {
      const parsedData = JSON.parse(cachedUserData);
      const updatedData = { ...parsedData, ...data };
      localStorage.setItem('user_data', JSON.stringify(updatedData));
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**

/**
 * Logout the user (client-side only)
 * Clears the access token and associated data
 */
export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_email");
};

/**
 * Sends a chat message to the API and returns the response
 * @param {string} query - The user's message
 * @param {string} threadId - Thread ID for conversation tracking
 * @returns {Promise<Object>} - The API response
 */
export const sendChatMessage = async (query, threadId = null) => {
  try {
    // Always generate a unique thread ID if none provided
    const actualThreadId = !threadId 
      ? `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      : threadId;
    
    // Store the thread ID for future use
    localStorage.setItem('user_thread_id', actualThreadId);
    
    // Get user email for user_key from multiple sources
    let userKey = null;
    
    // Try to get from user_data first (most complete)
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsedData = JSON.parse(userData);
      userKey = parsedData.email;
    }
    
    // If not found, try user_email directly
    if (!userKey) {
      userKey = localStorage.getItem("user_email");
    }
    
    // If still no user key, user must log in
    if (!userKey) {
      throw new Error("Authentication required. Please log in to continue.");
    }

    const response = await apiClient.post("/chat", {
      query,
      thread_id: actualThreadId,
      user_key: userKey,
    });

    return response.data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

/**
 * Get chat history for a specific thread or user
 * @param {string} threadId - Thread ID to filter by specific conversation
 * @param {string} userKey - Optional user key to filter by specific user
 * @param {number} limit - Maximum number of history items to return
 * @returns {Promise<Array>} - Chat history
 */
export const getChatHistory = async (threadId = null, userKey = null, limit = 50) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Use the user's email as the user_key if not provided
    if (!userKey) {
      // Try to get from user_data first (most complete)
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsedData = JSON.parse(userData);
        userKey = parsedData.email;
      }
      
      // If not found, try user_email directly
      if (!userKey) {
        userKey = localStorage.getItem("user_email");
      }
      
      // If still no user key, authentication is required
      if (!userKey) {
        throw new Error("Authentication required. Please log in to continue.");
      }
    }
    
    // Add user_key to params
    params.append("user_key", userKey);
    
    // Add thread_id only if provided and valid
    if (threadId && threadId.trim() !== '') {
      params.append("thread_id", threadId);
      console.log(`Fetching history for specific thread: ${threadId}`);
    } else {
      console.log('Fetching all user chat history (no specific thread)');
    }
    
    // Add limit
    params.append("limit", limit);

    console.log(`Calling API: /chat/history?${params.toString()}`);
    const response = await apiClient.get(`/chat/history?${params.toString()}`);
    console.log('API response received:', response);
    
    // Ensure we always return an array with the appropriate structure
    if (response.data && response.data.history && Array.isArray(response.data.history)) {
      console.log(`Found ${response.data.history.length} history items in response.data.history`);
      return response.data.history.map(item => {
        // Ensure each item has all the required properties
        return {
          ...item,
          id: item.id || `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          thread_id: item.thread_id || "",
          user_key: item.user_key || userKey,
          query: item.query || "No query",
          created_at: item.created_at || new Date().toISOString(),
          response: item.response || "No response"
        };
      });
    } else if (Array.isArray(response.data)) {
      console.log(`Found ${response.data.length} history items in direct response.data array`);
      return response.data.map(item => {
        // Ensure each item has all the required properties
        return {
          ...item,
          id: item.id || `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          thread_id: item.thread_id || "",
          user_key: item.user_key || userKey,
          query: item.query || "No query",
          created_at: item.created_at || new Date().toISOString(),
          response: item.response || "No response"
        };
      });
    }
    
    console.log('No valid history format found in API response');
    return [];
  } catch (error) {
    console.error("Error fetching chat history:", error);
    // Return empty array on error to prevent UI issues
    return [];
  }
};

// Simple export of all functions
export default {
  signup,
  login,
  logout,
  getCurrentUser,
  updateUserProfile,
  sendChatMessage,
  getChatHistory,
};