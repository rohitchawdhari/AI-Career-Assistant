import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserPlus,
  FaSpinner,
  FaArrowLeft,
  FaSignInAlt
} from "react-icons/fa";
import API from "../services/api";

function Signup({ setPage, setToken, setUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      newErrors.name = "Full name is required";
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await API.post(
        "/signup",
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }
      );

      toast.success("Registration successful! Welcome email sent 🎉");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setPage("login");
      }, 1000);

    } catch (err) {
      let errorMsg = "Registration failed. Try again.";
      if (err.response?.data?.detail) {
        errorMsg = typeof err.response.data.detail === "string" 
          ? err.response.data.detail 
          : "Registration request failed.";
      } else if (err.message === "Network Error") {
        errorMsg = "Network Error: Cannot connect to the server. Please verify the backend is running.";
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "724339906660-6j7jtrb29c92209q93e155o2014o4081.apps.googleusercontent.com",
          callback: handleGoogleCallback,
          ux_mode: "popup"
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signup-btn"),
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
  }, []);

  const handleGoogleCallback = async (response) => {
    try {
      setLoading(true);
      const res = await API.post("/google-signup", {
        credential: response.credential
      });

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

      toast.success(`Google Registration Successful! Welcome ${res.data.name} 🎉`);
      setTimeout(() => {
        setPage("dashboard");
      }, 800);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Google Login failed.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] flex justify-center items-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-12 transition-colors duration-300">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 md:w-[450px] h-80 md:h-[450px] rounded-full bg-purple-600/10 blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-cyan-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => setPage("landing")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition duration-300 text-sm font-medium mb-6"
        >
          <FaArrowLeft size={12} />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Account
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Sign up to get customized recommendations for your career.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-450">
              <FaUser />
            </span>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:outline-none"
            />
          </div>
          {errors.name && (
            <p className="text-red-500 dark:text-red-400 text-xs">{errors.name}</p>
          )}

          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-450">
              <FaEnvelope />
            </span>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:outline-none"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 dark:text-red-400 text-xs">{errors.email}</p>
          )}

          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-450">
              <FaLock />
            </span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:outline-none"
            />
          </div>
          {errors.password && (
            <p className="text-red-500 dark:text-red-400 text-xs">{errors.password}</p>
          )}

          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-450">
              <FaLock />
            </span>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              disabled={loading}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:outline-none"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 dark:text-red-400 text-xs">{errors.confirmPassword}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white py-3.5 rounded-xl font-bold transition duration-300 cursor-pointer"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <FaUserPlus />
                Sign Up
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
          <div id="google-signup-btn" className="w-full flex justify-center"></div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <button
            onClick={() => setPage("login")}
            className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <FaSignInAlt size={13} />
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;