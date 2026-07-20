import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaUsers, FaUpload, FaDatabase, FaEnvelopeOpenText, FaBan, FaCheck, FaTrash, FaMailBulk } from "react-icons/fa";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  
  // Announcement Form
  const [announce, setAnnounce] = useState({ subject: "", body: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchActivities();
    fetchUsers();
    fetchStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/stats");
      setStats(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load admin metrics");
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await API.get("/admin/recent-activities");
      setActivities(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async (term = "") => {
    try {
      const res = await API.get(`/admin/users?search=${term}`);
      setUsersList(res.data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await API.get("/admin/system-status");
      setStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockToggle = async (email, isBlocked) => {
    try {
      const res = await API.post("/admin/users/block", { email, block: !isBlocked });
      toast.success(res.data.message);
      fetchUsers(search);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Action failed");
    }
  };

  const handleRoleChange = async (email, currentRole) => {
    const newRole = currentRole === "recruiter" ? "user" : "recruiter";
    try {
      const res = await API.post("/admin/users/role", { email, role: newRole });
      toast.success(res.data.message);
      fetchUsers(search);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Action failed");
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Are you sure you want to completely wipe user ${email}?`)) return;
    try {
      const res = await API.delete(`/admin/users/delete?email=${email}`);
      toast.success(res.data.message);
      fetchUsers(search);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Delete failed");
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announce.subject || !announce.body) {
      toast.warning("Please fill subject and content.");
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/admin/send-announcement", announce);
      toast.success(res.data.message);
      setAnnounce({ subject: "", body: "" });
    } catch (e) {
      toast.error("Failed to broadcast announcement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-lg">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Total Users</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.total_users}</h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl"><FaUsers size={20} /></div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-lg">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Registrations Today</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.new_users_today}</h3>
            </div>
            <div className="p-3 bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-xl"><FaUsers size={20} /></div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-lg">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Resume Uploads</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.total_uploads}</h3>
            </div>
            <div className="p-3 bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 rounded-xl"><FaUpload size={20} /></div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-lg">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">ATS Evaluations</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.ats_analyses}</h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl"><FaDatabase size={20} /></div>
          </div>
        </div>
      )}

      {/* Feature Breakdown usage */}
      {stats && (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg">
          <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-base">🤖 AI Feature Usage Activity Tracker</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "JD Matches", val: stats.jd_analyses },
              { label: "AI Career Chats", val: stats.ai_chats },
              { label: "Mock Interviews", val: stats.mock_interviews },
              { label: "Resume Builder", val: stats.resume_builder_usage },
              { label: "GitHub Audits", val: stats.github_analyses },
              { label: "LinkedIn Audits", val: stats.linkedin_analyses },
              { label: "Portfolio Audits", val: stats.portfolio_analyses },
              { label: "Salary Predictions", val: stats.salary_predictions },
            ].map((f) => (
              <div key={f.label} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">{f.label}</span>
                <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">{f.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Management List */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Users list Search and Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="font-bold text-slate-800 dark:text-white text-base">👥 User Management</h4>
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchUsers(e.target.value);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2 text-xs outline-none focus:border-purple-500 w-full sm:w-60 font-semibold"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Resumes</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {usersList.map((user) => (
                  <tr key={user.email} className="text-slate-700 dark:text-slate-350">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{user.name}</td>
                    <td className="py-3">{user.email}</td>
                    <td className="py-3 font-bold">{user.uploads_count}</td>
                    <td className="py-3 capitalize"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-950 text-purple-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{user.role}</span></td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => handleBlockToggle(user.email, user.is_blocked)}
                        className={`p-1.5 rounded-lg border transition ${
                          user.is_blocked
                            ? "border-green-300 text-green-600 hover:bg-green-50"
                            : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                        }`}
                        title={user.is_blocked ? "Unblock User" : "Block User"}
                      >
                        {user.is_blocked ? <FaCheck size={10} /> : <FaBan size={10} />}
                      </button>
                      {user.email !== "rohitchawdhari48@gmail.com" && (
                        <button
                          onClick={() => handleRoleChange(user.email, user.role)}
                          className="px-2 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition text-[9px] font-black uppercase tracking-wider"
                          title="Toggle Recruiter Role"
                        >
                          {user.role === "recruiter" ? "User" : "Recruiter"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.email)}
                        className="p-1.5 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition"
                        title="Delete User"
                      >
                        <FaTrash size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Status & Announcements */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Health check */}
          {status && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-base">📡 System Diagnostics</h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">MongoDB Atlas</span>
                  <span className="font-bold text-green-500">{status.mongodb_status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">SMTP Email Server</span>
                  <span className="font-bold text-purple-500">{status.email_status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Gemini LLM API</span>
                  <span className="font-bold text-cyan-500">{status.gemini_status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Web Server Node</span>
                  <span className="font-bold text-green-500">{status.server_status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Announcements block */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-1.5">
              <FaEnvelopeOpenText className="text-purple-600" /> Broadcast Announcement
            </h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Announcement Subject..."
                value={announce.subject}
                onChange={(e) => setAnnounce({ ...announce, subject: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
              <textarea
                rows="4"
                placeholder="Type announcements content dispatch email to all..."
                value={announce.body}
                onChange={(e) => setAnnounce({ ...announce, body: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs resize-none font-semibold leading-relaxed"
              />
              <button
                onClick={handleSendAnnouncement}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                {loading ? "Sending..." : <><FaMailBulk /> Dispatch Broadcast</>}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;
