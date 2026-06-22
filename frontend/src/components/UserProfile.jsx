import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaUser, FaBriefcase, FaGraduationCap, FaSave } from "react-icons/fa";

function UserProfile() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    targetRole: "Software Engineer",
    experienceLevel: "Mid-Level",
    industry: "Technology",
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Error loading profile", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("user_profile", JSON.stringify(profile));
    toast.success("Profile updated successfully! 🚀");
  };

  const handleChange = (key, val) => {
    setProfile((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-all duration-300 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
          <FaUser className="text-3xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">User Profile Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Customize your details to tailor your AI career roadmap and suggestions.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">Full Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 transition"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">Target Role</label>
          <div className="relative">
            <FaBriefcase className="absolute left-3.5 top-4 text-slate-400" />
            <input
              type="text"
              value={profile.targetRole}
              onChange={(e) => handleChange("targetRole", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 pl-10 outline-none focus:border-purple-500 transition"
              placeholder="e.g. Senior DevOps Engineer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">Experience Level</label>
            <select
              value={profile.experienceLevel}
              onChange={(e) => handleChange("experienceLevel", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 transition"
            >
              <option value="Entry-Level">Entry-Level / Graduate</option>
              <option value="Junior">Junior (1-2 Years)</option>
              <option value="Mid-Level">Mid-Level (3-5 Years)</option>
              <option value="Senior">Senior (5+ Years)</option>
              <option value="Lead / Manager">Lead / Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">Industry</label>
            <input
              type="text"
              value={profile.industry}
              onChange={(e) => handleChange("industry", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 transition"
              placeholder="e.g. Technology, Finance"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <FaSave />
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default UserProfile;
