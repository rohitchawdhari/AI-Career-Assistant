import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaUserPlus,
  FaSpinner,
  FaArrowLeft,
  FaKey
} from "react-icons/fa";
import API from "../services/api";

function Login({ setPage, setToken, setUser }) {
  // Views: "login", "forgot", "verify"
  const [view, setView] = useState("login");
  
  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Forgot Password / OTP States
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "724339906660-6j7jtrb29c92209q93e155o2014o4081.apps.googleusercontent.com",
          callback: handleGoogleCallback,
          ux_mode: "popup"
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { 
            theme: "outline", 
            size: "large", 
            width: "382",
            text: "continue_with",
            shape: "rectangular"
          }
        );
      }
    };

    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, [view]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await API.post("/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      setToken(res.data.access_token);

      setUser({
        name: res.data.name,
        email: res.data.email,
        createdAt: res.data.created_at,
        lastLogin: res.data.last_login,
        loginHistory: res.data.login_history || [],
        expiresAt: res.data.expires_at,
        role: res.data.role || "user"
      });

      toast.success(`Welcome back, ${res.data.name}! 🎉`);

      setEmail("");
      setPassword("");

      setTimeout(() => {
        setPage("dashboard");
      }, 800);

    } catch (err) {
      let errorMsg = "Invalid email or password";
      if (err.response?.data?.detail) {
        errorMsg = typeof err.response.data.detail === "string" 
          ? err.response.data.detail 
          : "Invalid details supplied.";
      } else if (err.message === "Network Error") {
        errorMsg = "Network Error: Cannot connect to the server. Please verify the backend is running.";
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCallback = async (response) => {
    try {
      setLoading(true);
      const res = await API.post("/google-login", {
        credential: response.credential
      });

      if (res.data.status === "link_required") {
        const confirmLink = window.confirm(
          "This email is already registered using Email & Password. Would you like to link your Google account?"
        );
        if (confirmLink) {
          const linkRes = await API.post("/google-link", {
            credential: response.credential,
            confirm_link: true
          });
          setToken(linkRes.data.access_token);
          setUser({
            name: linkRes.data.name,
            email: linkRes.data.email,
            createdAt: linkRes.data.created_at,
            lastLogin: linkRes.data.last_login,
            loginHistory: linkRes.data.login_history || [],
            expiresAt: linkRes.data.expires_at,
            role: linkRes.data.role || "user",
            profile_picture: linkRes.data.profile_picture
          });
          toast.success("Account successfully linked and logged in! 🤝");
          setTimeout(() => {
            setPage("dashboard");
          }, 800);
        } else {
          toast.info("Account linking canceled.");
        }
      } else {
        setToken(res.data.access_token);
        setUser({
          name: res.data.name,
          email: res.data.email,
          createdAt: res.data.created_at,
          lastLogin: res.data.last_login,
          loginHistory: res.data.login_history || [],
          expiresAt: res.data.expires_at,
          role: res.data.role || "user",
          profile_picture: res.data.profile_picture
        });
        toast.success(`Welcome back, ${res.data.name}! 🎉`);
        setTimeout(() => {
          setPage("dashboard");
        }, 800);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Google Login failed.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const trimmedEmail = forgotEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await API.post("/forgot-password", { email: trimmedEmail });
      toast.success(res.data.message || "OTP has been sent to your email!");
      
      // Auto-populate for ease of developer testing if present in response
      if (res.data.otp) {
        setOtp(res.data.otp);
        toast.info(`Debug: Auto-populated OTP ${res.data.otp} (also printed in console)`);
      }
      
      setView("verify");
    } catch (err) {
      let errorMsg = "Email is not registered.";
      if (err.response?.data?.detail) {
        errorMsg = typeof err.response.data.detail === "string" 
          ? err.response.data.detail 
          : "Forgot password request failed.";
      } else if (err.message === "Network Error") {
        errorMsg = "Network Error: Cannot connect to the server. Please verify the backend is running.";
      }
      toast.error(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const trimmedEmail = forgotEmail.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    if (!trimmedOtp || !newPassword || !confirmPassword) {
      toast.error("All verification fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await API.post("/verify-otp", {
        email: trimmedEmail,
        otp: trimmedOtp,
        new_password: newPassword,
      });

      toast.success(res.data.message || "Password reset successful! Please login.");
      
      // Reset states
      setEmail(trimmedEmail);
      setForgotEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setView("login");
    } catch (err) {
      let errorMsg = "Verification failed. Check OTP code.";
      if (err.response?.data?.detail) {
        errorMsg = typeof err.response.data.detail === "string" 
          ? err.response.data.detail 
          : "Invalid OTP code.";
      } else if (err.message === "Network Error") {
        errorMsg = "Network Error: Cannot connect to the server. Please verify the backend is running.";
      }
      toast.error(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] flex justify-center items-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-12 transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 md:w-[450px] h-80 md:h-[450px] rounded-full bg-purple-600/10 blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-cyan-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800/80">
        
        {/* Render standard login form */}
        {view === "login" && (
          <>
            <button
              onClick={() => setPage("landing")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition duration-300 text-sm font-medium mb-6 cursor-pointer"
            >
              <FaArrowLeft size={12} />
              Back to Home
            </button>

            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Sign In to{" "}
                <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  Career Copilot
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Enter your details to access your personalized career hub.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    disabled={loading}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={`w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border ${
                      errors.email ? "border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-purple-500"
                    } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setView("forgot");
                    }}
                    className="text-xs text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400">
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    disabled={loading}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className={`w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border ${
                      errors.password ? "border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-purple-500"
                    } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold hover:from-purple-500 hover:to-cyan-400 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <FaSignInAlt />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider font-bold">Or</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <div className="flex justify-center w-full mt-2">
              <div id="google-signin-btn" className="w-full flex justify-center"></div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
              New user?{" "}
              <button
                onClick={() => setPage("signup")}
                className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <FaUserPlus size={13} />
                Create an Account
              </button>
            </div>
          </>
        )}

        {/* Forgot Password View */}
        {view === "forgot" && (
          <>
            <button
              type="button"
              onClick={() => setView("login")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition duration-300 text-sm font-medium mb-6 cursor-pointer"
            >
              <FaArrowLeft size={12} />
              Back to Login
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Forgot Password</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Enter your email address to receive a 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2">
                  Registered Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold transition cursor-pointer"
              >
                {forgotLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Request Verification Code"
                )}
              </button>
            </form>
          </>
        )}

        {/* Verify OTP / Reset Password View */}
        {view === "verify" && (
          <>
            <button
              type="button"
              onClick={() => setView("forgot")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition duration-300 text-sm font-medium mb-6 cursor-pointer"
            >
              <FaArrowLeft size={12} />
              Change Email
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reset Password</h2>
              <p className="text-slate-550 dark:text-slate-400 text-xs mt-2">
                Enter the OTP sent to <span className="font-semibold text-slate-850 dark:text-slate-200">{forgotEmail}</span> and choose a new password.
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2">
                  Verification Code (OTP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400">
                    <FaKey />
                  </span>
                  <input
                    type="text"
                    placeholder="Enter 6-Digit OTP"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 tracking-widest text-center font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400">
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400">
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3.5 rounded-xl font-bold transition cursor-pointer"
              >
                {forgotLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Account Password"
                )}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}

export default Login;