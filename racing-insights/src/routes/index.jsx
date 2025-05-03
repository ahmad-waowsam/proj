import { Signin, Signup, Chat } from "../pages";

export const publicRoutes = {
  signin: {
    path: "/signin",
    element: <Signin />,
  },
  signup: {
    path: "/signup",
    element: <Signup />,
  },
};

// Protected routes that require authentication
export const protectedRoutes = {
  chat: {
    path: "/chat",
    element: <Chat />,
  },
  // Support for thread-specific chat URLs
  chatWithThread: {
    path: "/chat/:threadId",
    element: <Chat />,
  },
};

// Helper function to get all public paths
export const getPublicPaths = () => {
  return Object.values(publicRoutes).map((route) => route.path);
};

// Helper function to get all protected paths
export const getProtectedPaths = () => {
  return Object.values(protectedRoutes).map((route) => route.path);
};
