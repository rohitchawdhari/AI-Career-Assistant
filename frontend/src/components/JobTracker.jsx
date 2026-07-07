import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaBriefcase, FaCalendarAlt, FaDollarSign, FaMapMarkerAlt, FaPlus, FaTrash, FaEdit, FaFilter, FaSearch } from "react-icons/fa";

function JobTracker() {
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("application_date");

  // Modal / Form State for Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    company: "",
    job_role: "",
    job_link: "",
    location: "",
    salary: 0,
    application_date: new Date().toISOString().split("T")[0],
    interview_date: "",
    status: "Applied",
    notes: "",
  });

  const statuses = [
    "Saved",
    "Applied",
    "Interview Scheduled",
    "Assessment",
    "Rejected",
    "Offer Received",
    "Accepted",
    "Rejected by User",
  ];

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [search, statusFilter, sortBy]);

  const fetchApplications = async () => {
    try {
      const res = await API.get(
        `/job-tracker/applications?search=${search}&status=${statusFilter}&sort_by=${sortBy}`
      );
      setApps(res.data.applications || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/job-tracker/stats");
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.job_role.trim()) {
      toast.warning("Company name and Job Role are required.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await API.put(`/job-tracker/applications/${editingId}`, form);
        toast.success("Job application updated successfully! 📁");
      } else {
        await API.post("/job-tracker/applications", form);
        toast.success("Job application tracked! 🚀");
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchApplications();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save application.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (app) => {
    setForm({
      company: app.company,
      job_role: app.job_role,
      job_link: app.job_link || "",
      location: app.location || "",
      salary: app.salary || 0,
      application_date: app.application_date || "",
      interview_date: app.interview_date || "",
      status: app.status,
      notes: app.notes || "",
    });
    setEditingId(app.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job application record?")) return;
    try {
      await API.delete(`/job-tracker/applications/${id}`);
      toast.success("Application deleted.");
      fetchApplications();
      fetchStats();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed.");
    }
  };

  const resetForm = () => {
    setForm({
      company: "",
      job_role: "",
      job_link: "",
      location: "",
      salary: 0,
      application_date: new Date().toISOString().split("T")[0],
      interview_date: "",
      status: "Applied",
      notes: "",
    });
  };

  return (
    <div className="space-y-8">
      {/* Top statistics summary widget */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Applications", count: stats.total, color: "border-purple-500" },
            { label: "Applied", count: stats.applied, color: "border-blue-500" },
            { label: "Interviews", count: stats.interviews, color: "border-yellow-500" },
            { label: "Offers", count: stats.offers, color: "border-green-500" },
            { label: "Rejections", count: stats.rejections, color: "border-red-500" },
          ].map((item) => (
            <div key={item.label} className={`bg-white dark:bg-slate-900 border-l-4 ${item.color} border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-md`}>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{item.label}</span>
              <span className="text-2xl font-black text-slate-850 dark:text-white mt-1 block">{item.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Control Actions & Search Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-3xl p-5">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><FaSearch /></span>
            <input
              type="text"
              placeholder="Search company/role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl py-2 pl-9 pr-4 outline-none text-xs w-full sm:w-48 font-semibold"
            />
          </div>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-350 rounded-xl py-2 px-3.5 outline-none text-xs font-bold"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-350 rounded-xl py-2 px-3.5 outline-none text-xs font-bold"
          >
            <option value="application_date">Application Date</option>
            <option value="salary">Highest Salary</option>
            <option value="company">Company Name</option>
          </select>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 px-4.5 rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <FaPlus size={10} /> Add Job Application
        </button>
      </div>

      {/* Main Grid Applications display */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <div key={app.id} className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
              app.status === 'Offer Received' || app.status === 'Accepted' ? 'bg-green-500' :
              app.status === 'Rejected' ? 'bg-red-500' : 'bg-purple-500'
            }`} />

            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-black text-slate-850 dark:text-white text-base leading-snug">{app.job_role}</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                  <FaBriefcase size={10} /> {app.company}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                app.status === 'Offer Received' || app.status === 'Accepted' ? 'bg-green-100 dark:bg-green-950 text-green-700' :
                app.status === 'Rejected' ? 'bg-red-100 dark:bg-red-950 text-red-650' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {app.status}
              </span>
            </div>

            <div className="space-y-2 mt-4.5 text-xs text-slate-550 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-850 py-3 mb-4">
              {app.location && (
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-slate-400" />
                  <span>{app.location}</span>
                </div>
              )}
              {app.salary > 0 && (
                <div className="flex items-center gap-2">
                  <FaDollarSign className="text-slate-400" />
                  <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(app.salary)} / year</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-slate-400" />
                <span>Applied: {app.application_date}</span>
              </div>
              {app.interview_date && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-450 font-bold">
                  <FaCalendarAlt />
                  <span>Interview: {app.interview_date}</span>
                </div>
              )}
            </div>

            {app.notes && (
              <p className="text-[11px] text-slate-450 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl italic mb-4 leading-relaxed">
                "{app.notes}"
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleEdit(app)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:text-purple-600 transition cursor-pointer"
                title="Edit Application"
              >
                <FaEdit size={10} />
              </button>
              <button
                onClick={() => handleDelete(app.id)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 rounded-lg hover:text-red-500 transition cursor-pointer"
                title="Delete Application"
              >
                <FaTrash size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL FORM POPUP */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-black mb-6 text-slate-900 dark:text-white">
              {editingId ? "Update Job Application" : "Track New Job Application"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Job Role *</label>
                  <input
                    type="text"
                    required
                    value={form.job_role}
                    onChange={(e) => setForm({ ...form, job_role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Salary (Annual INR)</label>
                  <input
                    type="number"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Application Date</label>
                  <input
                    type="date"
                    value={form.application_date}
                    onChange={(e) => setForm({ ...form, application_date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={form.interview_date}
                    onChange={(e) => setForm({ ...form, interview_date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-xl p-3 outline-none text-xs font-bold"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Job Link</label>
                  <input
                    type="text"
                    value={form.job_link}
                    onChange={(e) => setForm({ ...form, job_link: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs resize-none font-semibold leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow text-xs transition cursor-pointer"
              >
                {loading ? "Saving..." : "Save Application"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobTracker;
