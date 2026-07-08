import { useState } from "react";
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

  const handleGoogleSignIn = async () => {
    const gEmail = prompt("Enter Google account email to register/sign in:", "");
    if (!gEmail) return;
    const gName = prompt("Enter display name:", "");
    if (!gName) return;

    try {
      setLoading(true);
      const res = await API.post("/google-login", {
        email: gEmail.trim().toLowerCase(),
        name: gName.trim(),
        google_id: "google_oauth_" + Math.random().toString(36).substring(2, 10),
        picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
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

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 py-3.5 border border-slate-300 rounded-xl font-bold transition cursor-pointer shadow-sm text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.86 0 3.42.61 4.74 1.8l3.52-3.52C18.12 1.44 15.31 0 12 0 7.31 0 3.32 2.7 1.4 6.64l4.08 3.16C6.46 7.14 9.01 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.52 12.28c0-.77-.07-1.52-.2-2.28H12v4.51h6.47c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-2 3.73-4.94 3.73-8.68z"
            />
            <path
              fill="#FBBC05"
              d="M5.48 14.68C5.2 13.88 5.04 13 5.04 12s.16-1.88.44-2.68L1.4 6.16C.51 7.92 0 9.9 0 12s.51 4.08 1.4 5.84l4.08-3.16z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.66 0-6.76-2.48-7.86-5.8l-4.08 3.16C3.32 21.3 7.31 24 12 24z"
            />
          </svg>
          Continue with Google
        </button>

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