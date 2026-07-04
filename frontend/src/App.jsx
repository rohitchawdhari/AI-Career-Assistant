import { useState, useEffect } from "react";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from "./components/Navbar";
import API from "./services/api";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [page, setPage] = useState("landing");
  const [theme, setTheme] = useState("dark");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
    document.body.className = savedTheme;
  }, []);

  useEffect(() => {
    if (token) {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete API.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Helper to validate JWT structure & expiration time
  const validateToken = (t) => {
    if (!t) return false;
    try {
      const parts = t.split(".");
      if (parts.length !== 3) return false;
      
      // Decode base64url payload
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }
      return true;
    } catch (e) {
      console.error("JWT validation error:", e);
      return false;
    }
  };

  // JWT Validation check on page changes
  useEffect(() => {
    if (page === "dashboard") {
      if (!token) {
        setPage("login");
      } else {
        const isValid = validateToken(token);
        if (!isValid) {
          toast.warn("Invalid or expired session. Please log in again.");
          handleLogout();
        }
      }
    }
  }, [page, token]);

  // Auto logout timer based on token expiration
  useEffect(() => {
    if (!token || !user?.expiresAt) return;

    const expiryTimeMs = user.expiresAt * 1000;
    const remainingTime = expiryTimeMs - Date.now();

    if (remainingTime <= 0) {
      toast.warn("Session expired. Auto-logging out...");
      handleLogout();
      return;
    }

    const timer = setTimeout(() => {
      toast.warn("Your session has expired. You have been logged out.");
      handleLogout();
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [token, user]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    delete API.defaults.headers.common["Authorization"];
    setPage("landing");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.className = nextTheme;
    document.body.className = nextTheme;
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Navbar
        page={page}
        setPage={setPage}
        theme={theme}
        toggleTheme={toggleTheme}
        token={token}
        user={user}
        onLogout={handleLogout}
      />

      {page === "landing" && (
        <Landing
          token={token}
          setPage={setPage}
          onGetStarted={() => setPage(token ? "dashboard" : "login")}
        />
      )}

      {page === "login" && (
        <Login setPage={setPage} setToken={setToken} setUser={setUser} />
      )}

      {page === "signup" && <Signup setPage={setPage} />}

      {page === "dashboard" && <Dashboard user={user} onLogout={handleLogout} />}

      <ToastContainer position="bottom-right" autoClose={3000} theme={theme} />
    </div>
  );
}

export default App;