import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaUser, FaBriefcase, FaSave, FaSignOutAlt, FaLock, FaKey, FaShieldAlt, FaChartLine } from "react-icons/fa";
import API from "../services/api";

function UserProfile({ user, onLogout, atsScore, filename }) {
  const [profile, setProfile] = useState({
    name: "John Doe",
    targetRole: "Software Engineer",
    experienceLevel: "Mid-Level",
    industry: "Technology",
  });

  // Stats State
  const [stats, setStats] = useState({
    uploadCount: 0,
    avgScore: 0,
  });

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    // Load custom profile settings
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Error loading profile", e);
      }
    } else if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.name || prev.name,
      }));
    }
  }, [user]);

  // Load and calculate upload count and average ATS score
  useEffect(() => {
    const historyData = localStorage.getItem("career_history");
    let uploadCount = 0;
    let avgScore = 0;

    if (historyData) {
      try {
        const list = JSON.parse(historyData);
        const atsList = list.filter((item) => item.type === "ats");
        uploadCount = atsList.length;
        if (uploadCount > 0) {
          const totalScore = atsList.reduce((acc, item) => acc + (item.score || 0), 0);
          avgScore = Math.round(totalScore / uploadCount);
        }
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }

    if (uploadCount === 0 && filename) {
      uploadCount = 1;
      avgScore = atsScore || 0;
    }

    setStats({ uploadCount, avgScore });
  }, [atsScore, filename]);

  const handleSave = () => {
    localStorage.setItem("user_profile", JSON.stringify(profile));
    toast.success("Profile settings updated successfully! 🚀");
  };

  const handleChange = (key, val) => {
    setProfile((prev) => ({ ...prev, [key]: val }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await API.post("/change-password", {
        email: user?.email,
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success(res.data.message || "Password changed successfully! 🔐");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to change password. Verify your current password.";
      toast.error(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Get Initials for Avatar
  const getInitials = () => {
    const nameToUse = profile.name || user?.name || "User";
    const parts = nameToUse.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameToUse.slice(0, 2).toUpperCase();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto w-full transition-all duration-300">
      
      {/* Left Column: Avatar Card & Meta Details */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col items-center text-center">
        
        {/* Avatar Area */}
        <div className="relative mb-5 mt-2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-650 to-cyan-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-purple-500/20">
            {getInitials()}
          </div>
          <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900 animate-pulse" />
        </div>

        {/* User Info */}
        <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate max-w-full">
          {profile.name || user?.name || "Career Builder"}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm truncate max-w-full mb-4">
          {user?.email || "guest@example.com"}
        </p>

        {/* Status Indicators */}
        <div className="w-full space-y-3.5 border-t border-b border-slate-105 dark:border-slate-800/80 py-4.5 my-4.5 text-left text-xs text-slate-650 dark:text-slate-300">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">Account Status</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/50 dark:border-emerald-900/30">
              Active
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">Account Created</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">Last Login</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {user?.lastLogin ? new Date(user.lastLogin * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
            </span>
          </div>
        </div>

        {/* Career Stats Widget */}
        <div className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-105 dark:border-slate-800/60 rounded-2xl p-4 text-left mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
            <FaChartLine /> Analytics Summary
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800 rounded-xl p-3 shadow-sm">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Resumes</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">
                {stats.uploadCount}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800 rounded-xl p-3 shadow-sm">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Avg Score</span>
              <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                {stats.avgScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 border border-red-200 dark:border-red-950/40 text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/15 hover:bg-red-100 dark:hover:bg-red-950/30 py-3 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer"
        >
          <FaSignOutAlt />
          Logout Profile Session
        </button>

      </div>

      {/* Right Column: Settings Sections */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Section 1: Edit Details */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <FaUser className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Details</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Customize your personal profile settings.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 text-xs uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 text-xs uppercase tracking-wider">Target Job Role</label>
              <div className="relative">
                <FaBriefcase className="absolute left-3.5 top-4.5 text-slate-400" />
                <input
                  type="text"
                  value={profile.targetRole}
                  onChange={(e) => handleChange("targetRole", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 pl-10 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition text-sm"
                  placeholder="e.g. Software Development Engineer"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 text-xs uppercase tracking-wider">Experience Level</label>
                <select
                  value={profile.experienceLevel}
                  onChange={(e) => handleChange("experienceLevel", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition text-sm cursor-pointer"
                >
                  <option value="Entry-Level">Entry-Level / Graduate</option>
                  <option value="Junior">Junior (1-2 Years)</option>
                  <option value="Mid-Level">Mid-Level (3-5 Years)</option>
                  <option value="Senior">Senior (5+ Years)</option>
                  <option value="Lead / Manager">Lead / Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 text-xs uppercase tracking-wider">Industry</label>
                <input
                  type="text"
                  value={profile.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition text-sm"
                  placeholder="e.g. Technology, Healthcare"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl shadow-lg transition duration-300 transform active:scale-99 text-sm cursor-pointer"
            >
              <FaSave />
              Save Details Changes
            </button>
          </div>
        </div>

        {/* Section 2: Change Password */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl">
              <FaShieldAlt className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Security Settings</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Manage and update your account password security.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 text-xs uppercase tracking-wider">Current Password</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-4.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 pl-10 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 text-xs uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <FaKey className="absolute left-3.5 top-4.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 pl-10 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 text-xs uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <FaKey className="absolute left-3.5 top-4.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 pl-10 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition duration-300 transform active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {passwordLoading ? "Updating Credentials..." : "Update Account Password"}
            </button>
          </form>
        </div>

        {/* Section 3: User Login Activity Table */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="p-3 bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <FaChartLine className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Login Audit Logs</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Audit log of login activities associated with this account.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">IP Address</th>
                  <th className="px-4 py-3.5">Device & Browser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                {user?.loginHistory && user.loginHistory.length > 0 ? (
                  user.loginHistory.map((log, index) => (
                    <tr key={index} className="text-slate-750 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">
                        {new Date(log.timestamp * 1000).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-cyan-600 dark:text-cyan-400">{log.ip_address}</td>
                      <td className="px-4 py-3 truncate max-w-[200px]" title={log.user_agent}>
                        {log.user_agent}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-slate-400 italic">
                      No login history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

export default UserProfile;
