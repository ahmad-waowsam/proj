import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProviderWrapper } from "./constants/ThemeContext";
import { publicRoutes, protectedRoutes } from "./routes";
import AuthGuard from "./components/auth/auth-guard";

function App() {
  // Check if user is already logged in to determine initial redirect
  const hasToken = localStorage.getItem("access_token");

  return (
    <ThemeProviderWrapper>
      <BrowserRouter basename="/">
        <Routes>
          {/* Default redirect to chat if logged in, otherwise signin */}
          <Route path="/" element={<Navigate to={hasToken ? "/chat" : "/signin"} replace />} />

          {/* Public Routes */}
          {Object.values(publicRoutes).map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {/* Protected Routes with AuthGuard */}
          {Object.values(protectedRoutes).map(({ path, element }) => (
            <Route 
              key={path} 
              path={path} 
              element={<AuthGuard>{element}</AuthGuard>} 
            />
          ))}

          {/* 404 Route */}
          <Route path="*" element={<Navigate to={hasToken ? "/chat" : "/signin"} replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProviderWrapper>
  );
}

export default App;
