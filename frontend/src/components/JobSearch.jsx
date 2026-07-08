import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaSearch, FaBriefcase, FaDollarSign, FaMapMarkerAlt, FaPlus, FaCheck } from "react-icons/fa";

function JobSearch() {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [company, setCompany] = useState("");
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackingIds, setTrackingIds] = useState(new Set());

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!role.trim() && !skills.trim()) {
      toast.warning("Please specify target role or skills to search.");
      return;
    }
    
    try {
      setLoading(true);
      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await API.post("/enterprise/job-search", {
        role: role.trim(),
        skills: skillList,
        location: location.trim(),
        salary_range: salaryRange.trim(),
        company: company.trim()
      });
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to query job opportunities.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTracker = async (job, index) => {
    try {
      await API.post("/job-tracker/applications", {
        company: job.company,
        job_role: job.title,
        job_link: job.apply_link,
        location: job.location,
        salary: parseInt(job.salary.replace(/[^0-9]/g, "")) || 800000,
        application_date: new Date().toISOString().split("T")[0],
        status: "Applied",
        notes: "Added via AI Job Search Match Finder."
      });
      toast.success(`Tracked ${job.title} at ${job.company}! 💼`);
      setTrackingIds((prev) => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    } catch (e) {
      toast.error("Failed to add to tracker.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Search filters panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-black text-slate-850 dark:text-white mb-5 flex items-center gap-2">
          🔍 AI-Powered Job Search Engine
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Target Role</label>
              <input
                type="text"
                placeholder="e.g. Backend Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Core Skills (Comma separated)</label>
              <input
                type="text"
                placeholder="FastAPI, Python, MongoDB"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. Remote, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Salary Range</label>
              <input
                type="text"
                placeholder="e.g. ₹15,00,000 - ₹25,00,000"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Preferred Company</label>
              <input
                type="text"
                placeholder="e.g. Google"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? "Searching Opportunities..." : <><FaSearch /> Run AI Search</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-black text-slate-850 dark:text-white text-base leading-snug">{job.title}</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                  <FaBriefcase size={10} /> {job.company}
                </p>
              </div>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black">
                {job.score}% Match
              </span>
            </div>

            <div className="space-y-2 mt-4 text-xs text-slate-550 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-slate-400" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaDollarSign className="text-slate-400" />
                <span>{job.salary}</span>
              </div>
            </div>

            <div className="my-3 space-y-2">
              <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Analysis</h5>
              <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed italic bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl">
                "{job.why_matches}"
              </p>
            </div>

            {job.missing_skills?.length > 0 && (
              <div className="mb-4">
                <span className="text-[9px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wider block mb-1">Gaps Found</span>
                <div className="flex flex-wrap gap-1">
                  {job.missing_skills.map((s) => (
                    <span key={s} className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] rounded font-semibold">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 border-t border-slate-100 dark:border-slate-850 pt-4 mt-3">
              <a
                href={job.apply_link}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-center font-bold text-xs py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 transition"
              >
                Apply Direct
              </a>
              <button
                onClick={() => handleAddToTracker(job, idx)}
                disabled={trackingIds.has(idx)}
                className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  trackingIds.has(idx)
                    ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow"
                }`}
              >
                {trackingIds.has(idx) ? <><FaCheck /> Tracked</> : <><FaPlus /> Track Job</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default JobSearch;
