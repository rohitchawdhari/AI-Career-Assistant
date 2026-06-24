import { FaSun, FaMoon, FaSignOutAlt } from "react-icons/fa";

function Navbar({ page, setPage, theme, toggleTheme, token, user, onLogout }) {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/75 border-b border-slate-200 dark:border-slate-850 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div onClick={() => setPage("landing")} className="cursor-pointer">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
            <span>🚀</span>
            AI Career{" "}
            <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Assistant
            </span>
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-600 dark:text-yellow-400 transition-all duration-300"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <FaSun size={15} /> : <FaMoon size={15} className="text-purple-600" />}
          </button>

          {/* Authentication related navigation */}
          {token ? (
            // Logged In Controls
            <div className="flex items-center gap-3">
              {user && (
                <span className="hidden sm:inline text-sm font-semibold text-slate-600 dark:text-slate-350">
                  Hi, {user.name} 👋
                </span>
              )}
              {page !== "dashboard" ? (
                <button
                  onClick={() => setPage("dashboard")}
                  className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 transform active:scale-95 text-sm"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => setPage("landing")}
                  className="border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-850 transition-all duration-300 text-sm"
                >
                  Landing Page
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 border border-red-200 dark:border-red-950/40 text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/15 hover:bg-red-100 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-xl font-bold transition-all duration-300 text-sm"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          ) : (
            // Not Logged In Controls
            <div className="flex items-center gap-2.5">
              {page === "landing" ? (
                <>
                  <button
                    onClick={() => setPage("login")}
                    className="text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white font-bold px-4 py-2.5 rounded-xl transition duration-300 text-sm"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setPage("signup")}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 transform active:scale-95 text-sm"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setPage("landing")}
                  className="border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-850 transition-all duration-300 text-sm"
                >
                  Back to Home
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;