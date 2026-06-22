import { FaSun, FaMoon, FaBriefcase, FaGraduationCap } from "react-icons/fa";

function Navbar({ page, setPage, theme, toggleTheme }) {
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

          {/* Page Routing CTA */}
          {page === "landing" ? (
            <button
              onClick={() => setPage("dashboard")}
              className="bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 transform active:scale-95"
            >
              Enter App
            </button>
          ) : (
            <button
              onClick={() => setPage("landing")}
              className="border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-850 transition-all duration-300"
            >
              Landing Page
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;