import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  FaBriefcase, FaUpload, FaTrash, FaArrowLeft, FaFileAlt, FaCheckCircle, 
  FaExclamationCircle, FaUserCheck, FaInfoCircle, FaChartBar, FaSearch, 
  FaPlus, FaEdit, FaSortAmountDown, FaFilter, FaTimesCircle, FaFilePdf, 
  FaFileExcel, FaHistory, FaCalendarAlt, FaClock, FaVideo, FaMapMarkerAlt 
} from "react-icons/fa";
import API from "../services/api";

function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  
  // Job Creation/Edit Form
  const [newJob, setNewJob] = useState({ title: "", description: "", skills: "" });
  const [jobLoading, setJobLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  
  // Resume Upload State
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);

  // Selected Applicant for Detail Modal
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  
  // Filter & Sort Settings
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("score_desc");
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  // Comparison Candidates (holds up to 3 candidate objects)
  const [compareCandidates, setCompareCandidates] = useState([]);

  // Recruiter Activity Logs Drawer State
  const [activityLogs, setActivityLogs] = useState([]);
  const [showActivityLogs, setShowActivityLogs] = useState(false);

  // Interview Scheduling Modal State
  const [interviewApplicant, setInterviewApplicant] = useState(null);
  const [interviewData, setInterviewData] = useState({
    date: "",
    time: "",
    mode: "Online",
    link_or_venue: "",
    notes: ""
  });
  const [interviewLoading, setInterviewLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchApplicants(selectedJob.id);
    }
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      const res = await API.get("/recruiter/jobs");
      setJobs(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load job postings");
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      const res = await API.get(`/recruiter/jobs/${jobId}/applicants`);
      setApplicants(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load candidate list");
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await API.get("/recruiter/activity-logs");
      setActivityLogs(res.data || []);
      setShowActivityLogs(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load recruiter activity logs");
    }
  };

  const handleCreateOrEditJob = async (e) => {
    e.preventDefault();
    if (!newJob.title.trim() || !newJob.description.trim()) {
      toast.warning("Please fill out the Job Title and Description.");
      return;
    }
    
    setJobLoading(true);
    try {
      const skillsArray = newJob.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
        
      if (editingJobId) {
        // Edit flow
        await API.put(`/recruiter/jobs/${editingJobId}`, {
          title: newJob.title.trim(),
          description: newJob.description.trim(),
          skills: skillsArray
        });
        toast.success("Job posting updated successfully! 📝");
        setEditingJobId(null);
      } else {
        // Create flow
        await API.post("/recruiter/jobs", {
          title: newJob.title.trim(),
          description: newJob.description.trim(),
          skills: skillsArray
        });
        toast.success("Job posting created successfully! 💼");
      }
      
      fetchJobs();
      setNewJob({ title: "", description: "", skills: "" });
      setShowCreateForm(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to save job posting");
    } finally {
      setJobLoading(false);
    }
  };

  const handleStartEdit = (job, e) => {
    e.stopPropagation();
    setNewJob({
      title: job.title,
      description: job.description,
      skills: job.skills?.join(", ") || ""
    });
    setEditingJobId(job.id);
    setShowCreateForm(true);
  };

  const handleDeleteJob = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this job posting and all its ranked candidates?")) return;
    
    try {
      await API.delete(`/recruiter/jobs/${id}`);
      toast.success("Job posting removed");
      setJobs(jobs.filter((j) => j.id !== id));
      if (selectedJob?.id === id) {
        setSelectedJob(null);
        setApplicants([]);
        setCompareCandidates([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job posting");
    }
  };

  // Drag and Drop Resume Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadCandidateResumes(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadCandidateResumes(e.target.files);
    }
  };

  const uploadCandidateResumes = async (fileList) => {
    const files = Array.from(fileList);
    setUploadedFilesCount(files.length);
    setUploadProgress(true);
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await API.post(`/recruiter/jobs/${selectedJob.id}/upload-resumes`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(`Screened and ranked ${res.data.results?.length} candidate resumes successfully! 🎯`);
      fetchApplicants(selectedJob.id);
      fetchJobs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse and rank candidate resumes.");
    } finally {
      setUploadProgress(false);
    }
  };

  const handleStatusChange = async (applicantId, newStatus) => {
    try {
      await API.post(`/recruiter/applicants/${applicantId}/status`, { status: newStatus });
      toast.success(`Candidate status updated to ${newStatus}`);
      
      setApplicants(applicants.map(app => app.id === applicantId ? { ...app, status: newStatus } : app));
      fetchJobs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update candidate status");
    }
  };

  const handleOpenInterviewModal = (applicant) => {
    setInterviewApplicant(applicant);
    setInterviewData({
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: "10:00",
      mode: "Online",
      link_or_venue: "https://meet.google.com/abc-defg-hij",
      notes: "Technical interview & project discussion."
    });
  };

  const handleSaveInterview = async (e) => {
    e.preventDefault();
    if (!interviewData.date || !interviewData.time || !interviewData.link_or_venue.trim()) {
      toast.warning("Please fill out Date, Time, and Meeting Link or Venue.");
      return;
    }
    setInterviewLoading(true);
    try {
      await API.post("/recruiter/interviews", {
        applicant_id: interviewApplicant.id,
        date: interviewData.date,
        time: interviewData.time,
        mode: interviewData.mode,
        link_or_venue: interviewData.link_or_venue.trim(),
        notes: interviewData.notes.trim()
      });
      toast.success(`Interview scheduled for ${interviewApplicant.candidate_name}! 📅 Notification email sent.`);
      setInterviewApplicant(null);
      if (selectedJob) fetchApplicants(selectedJob.id);
      fetchJobs();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to schedule interview");
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleExportCSV = () => {
    const listToExport = filteredApplicants.filter(a => statusFilter === "Shortlisted" ? a.status === "Shortlisted" : true);
    if (listToExport.length === 0) {
      toast.warning("No candidates match current export filter.");
      return;
    }

    const headers = ["Candidate Name", "Email", "Job Title", "ATS Score (%)", "Status", "Matched Skills", "Experience Summary", "Education Match"];
    const rows = listToExport.map(a => [
      `"${a.candidate_name.replace(/"/g, '""')}"`,
      `"${a.candidate_email.replace(/"/g, '""')}"`,
      `"${(selectedJob?.title || 'Position').replace(/"/g, '""')}"`,
      a.ats_match_score,
      `"${a.status}"`,
      `"${(a.matched_skills || []).join(', ').replace(/"/g, '""')}"`,
      `"${(a.experience_summary || 'N/A').replace(/"/g, '""')}"`,
      `"${(a.education_match || 'N/A').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Candidates_${selectedJob?.title || "Export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported candidates to Excel/CSV successfully! 📊");
  };

  const handleExportPDF = () => {
    const listToExport = filteredApplicants.filter(a => statusFilter === "Shortlisted" ? a.status === "Shortlisted" : true);
    if (listToExport.length === 0) {
      toast.warning("No candidates match current export filter.");
      return;
    }

    const printWindow = window.open("", "_blank");
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Candidate Evaluation Export - ${selectedJob?.title || 'Recruitment'}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; }
          h1 { color: #4f46e5; margin-bottom: 5px; font-size: 22px; }
          h3 { color: #64748b; margin-top: 0; font-weight: 500; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #4f46e5; color: white; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
          .score { background: #e0e7ff; color: #4338ca; }
          .status-shortlisted { background: #dcfce7; color: #15803d; }
          .status-rejected { background: #fee2e2; color: #b91c1c; }
          .status-review { background: #f1f5f9; color: #475569; }
          .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; border-t: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <h1>Recruitment Candidate Evaluation Report</h1>
        <h3>Position: ${selectedJob?.title || 'Open Role'} | Total Records: ${listToExport.length} | Exported: ${new Date().toLocaleDateString()}</h3>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Candidate Name</th>
              <th>Email</th>
              <th>ATS Score</th>
              <th>Status</th>
              <th>Matched Skills</th>
              <th>Experience Fit</th>
            </tr>
          </thead>
          <tbody>
            ${listToExport.map((a, idx) => `
              <tr>
                <td>#${idx + 1}</td>
                <td><strong>${a.candidate_name}</strong></td>
                <td>${a.candidate_email}</td>
                <td><span class="badge score">${a.ats_match_score}%</span></td>
                <td><span class="badge ${a.status === 'Shortlisted' ? 'status-shortlisted' : a.status === 'Rejected' ? 'status-rejected' : 'status-review'}">${a.status}</span></td>
                <td>${(a.matched_skills || []).slice(0, 6).join(', ')}</td>
                <td>${a.experience_summary || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">AI Career Assistant Recruitment Platform &copy; ${new Date().getFullYear()}</div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    toast.success("Opened PDF Report printable window! 📄");
  };

  const handleToggleComparison = (candidate) => {
    const isAlreadyAdded = compareCandidates.some(c => c.id === candidate.id);
    if (isAlreadyAdded) {
      setCompareCandidates(compareCandidates.filter(c => c.id !== candidate.id));
    } else {
      if (compareCandidates.length >= 3) {
        toast.warning("You can compare a maximum of 3 candidates side-by-side.");
        return;
      }
      setCompareCandidates([...compareCandidates, candidate]);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "from-emerald-400 to-teal-500 text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 60) return "from-cyan-400 to-blue-500 text-cyan-500 border-cyan-500/20 bg-cyan-500/5";
    if (score >= 40) return "from-yellow-400 to-orange-500 text-yellow-500 border-yellow-500/20 bg-yellow-500/5";
    return "from-red-450 to-rose-500 text-red-500 border-red-500/20 bg-red-500/5";
  };

  const getStatusBadge = (status) => {
    if (status === "Shortlisted") return "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-450 border border-green-200 dark:border-green-900/30";
    if (status === "Rejected") return "bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-450 border border-red-200 dark:border-red-900/30";
    return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-750";
  };

  // Filtering & Sorting calculations
  const filteredApplicants = applicants
    .filter(app => {
      const matchSearch = 
        app.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.matched_skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.experience_summary || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.education_match || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === "All" || app.status === statusFilter;
      const matchScore = app.ats_match_score >= minScoreFilter;
      
      return matchSearch && matchStatus && matchScore;
    })
    .sort((a, b) => {
      if (sortOption === "score_desc") return b.ats_match_score - a.ats_match_score;
      if (sortOption === "score_asc") return a.ats_match_score - b.ats_match_score;
      if (sortOption === "name_asc") return a.candidate_name.localeCompare(b.candidate_name);
      return 0;
    });

  // Calculate selected job stats dynamically
  const jobStats = selectedJob ? {
    total: applicants.length,
    avg: applicants.length ? Math.round(applicants.reduce((sum, app) => sum + app.ats_match_score, 0) / applicants.length) : 0,
    shortlisted: applicants.filter(app => app.status === "Shortlisted").length,
    rejected: applicants.filter(app => app.status === "Rejected").length,
  } : null;

  return (
    <div className="space-y-8 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 backdrop-blur-xl">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <span>🛡️</span> Recruiter Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1.5">
            Automated screening, AI Ranking, and Recruitment Transparency Matrix
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchActivityLogs}
            className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-2xl shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-700 text-xs cursor-pointer"
          >
            <FaHistory className="text-purple-500" />
            Activity Audit Logs
          </button>

          {!selectedJob && (
            <button
              onClick={() => {
                setEditingJobId(null);
                setNewJob({ title: "", description: "", skills: "" });
                setShowCreateForm(!showCreateForm);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg transition-all duration-300 transform active:scale-95 text-xs cursor-pointer"
            >
              <FaPlus />
              {showCreateForm ? "Close Form" : "Create Job Opening"}
            </button>
          )}
        </div>
      </div>

      {/* JOBS LIST AND CREATION FORM */}
      {!selectedJob && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Create Job Posting Form */}
          {showCreateForm && (
            <div className="lg:col-span-1 h-fit bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-md animate-in slide-in-from-left duration-300">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200/40 dark:border-slate-800/60 pb-3 mb-5 flex items-center gap-2">
                <span>{editingJobId ? "📝" : "➕"}</span> {editingJobId ? "Edit Position" : "Create New Position"}
              </h3>
              
              <form onSubmit={handleCreateOrEditJob} className="space-y-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full bg-slate-55/40 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 text-slate-950 dark:text-white rounded-2xl px-4.5 py-3 text-xs outline-none focus:border-purple-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Required Skills (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, TypeScript, Tailwind, Redux"
                    value={newJob.skills}
                    onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                    className="w-full bg-slate-55/40 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 text-slate-950 dark:text-white rounded-2xl px-4.5 py-3 text-xs outline-none focus:border-purple-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Detailed Job Description</label>
                  <textarea
                    required
                    rows="6"
                    placeholder="Describe roles, responsibilities, and qualifications required..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    className="w-full bg-slate-55/40 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 text-slate-950 dark:text-white rounded-2xl px-4.5 py-3 text-xs outline-none focus:border-purple-500 font-semibold leading-relaxed"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={jobLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-2xl transition duration-300 text-xs shadow-md shadow-purple-900/10 cursor-pointer"
                >
                  {jobLoading ? "Publishing Job..." : editingJobId ? "Save Changes" : "Publish Position"}
                </button>
              </form>
            </div>
          )}

          {/* Active Jobs Grid */}
          <div className={showCreateForm ? "lg:col-span-2 space-y-6" : "lg:col-span-3 grid md:grid-cols-2 lg:grid-cols-3 gap-6"}>
            {jobs.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white/50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/45 dark:border-slate-800/60">
                <FaBriefcase className="mx-auto text-4xl text-slate-300 mb-4" />
                <h4 className="font-bold text-slate-700 dark:text-slate-350">No job postings created yet</h4>
                <p className="text-slate-400 text-xs mt-2">Click "Create Job Opening" to define a role and start screening candidate profiles.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 to-indigo-650" />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 dark:text-white text-base tracking-tight leading-tight group-hover:text-purple-500 transition duration-200">
                        {job.title}
                      </h3>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => handleStartEdit(job, e)}
                          className="text-slate-400 hover:text-purple-500 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit Position"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteJob(job.id, e)}
                          className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Delete Position"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {job.skills?.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-650 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                      {job.skills?.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-bold self-center">
                          +{job.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-850/50 mt-5 pt-4 flex flex-col gap-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-450 dark:text-slate-400 font-bold">
                      <div>Applicants: <span className="text-purple-500 font-black">{job.applicant_count || 0}</span></div>
                      <div>Avg Score: <span className="text-cyan-500 font-black">{job.avg_score || 0}%</span></div>
                      <div>Shortlisted: <span className="text-green-500 font-black">{job.shortlisted_count || 0}</span></div>
                      <div>Rejected: <span className="text-red-500 font-black">{job.rejected_count || 0}</span></div>
                    </div>
                    <div className="text-purple-650 dark:text-purple-400 font-black flex items-center gap-1 group-hover:underline self-end pt-1">
                      Screen & Rank Candidates &rarr;
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* DETAILED APPLICANT SCREENING AND RANKING FOR SELECTED JOB */}
      {selectedJob && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Back Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setCompareCandidates([]);
                }}
                className="flex items-center gap-2 text-slate-550 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white font-bold text-xs cursor-pointer"
              >
                <FaArrowLeft /> Back to Job Board
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-850 dark:text-white font-black text-sm">Role: {selectedJob.title}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FaFilePdf /> Export PDF
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FaFileExcel /> Export Excel/CSV
              </button>
              
              <button
                onClick={(e) => handleStartEdit(selectedJob, e)}
                className="flex items-center gap-1.5 border border-purple-500/35 text-purple-500 hover:bg-purple-500/5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FaEdit /> Edit Requirements
              </button>
            </div>
          </div>

          {/* JOB ANALYTICS METRICS BAR */}
          {jobStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-md">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Candidates</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{jobStats.total}</h3>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 rounded-xl"><FaBriefcase size={16} /></div>
              </div>

              <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-md">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg AI Compatibility</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{jobStats.avg}%</h3>
                </div>
                <div className="p-3 bg-cyan-100 dark:bg-cyan-950/40 text-cyan-650 dark:text-cyan-400 rounded-xl"><FaChartBar size={16} /></div>
              </div>

              <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-md">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shortlisted Profiles</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{jobStats.shortlisted}</h3>
                </div>
                <div className="p-3 bg-green-150 dark:bg-green-950/40 text-green-600 dark:text-green-405 rounded-xl"><FaCheckCircle size={16} /></div>
              </div>

              <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-md">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rejected Profiles</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{jobStats.rejected}</h3>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-405 rounded-xl"><FaTimesCircle size={16} /></div>
              </div>

            </div>
          )}

          {/* SPLIT SCREEN: JOB DETAILS & RESUME UPLOADER */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Job Description Requirements Panel */}
            <div className="lg:col-span-1 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 p-6 backdrop-blur-xl shadow-lg space-y-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white border-b border-slate-200/30 dark:border-slate-800/60 pb-3 flex items-center gap-2">
                <span>📋</span> Job Requirements
              </h3>
              <div>
                <h4 className="text-slate-550 dark:text-slate-350 font-bold text-sm">{selectedJob.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed h-48 overflow-y-auto pr-1">
                  {selectedJob.description}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Key Competencies Required:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skills?.map((s, idx) => (
                    <span key={idx} className="bg-purple-100/40 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bulk Resume Upload Zone */}
            <div className="lg:col-span-2">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative h-full flex flex-col justify-center items-center rounded-3xl border-2 border-dashed p-8 transition duration-300 min-h-[300px] ${
                  dragActive
                    ? "border-purple-500 bg-purple-500/5"
                    : "border-slate-250 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20"
                }`}
              >
                <input
                  type="file"
                  multiple
                  id="resume-file-upload"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                />
                
                {uploadProgress ? (
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto" />
                    <h4 className="font-bold text-slate-800 dark:text-white">AI Screening Candidates...</h4>
                    <p className="text-slate-400 text-xs">Parsing {uploadedFilesCount} resume documents & ranking matches. Please wait.</p>
                  </div>
                ) : (
                  <label htmlFor="resume-file-upload" className="text-center cursor-pointer space-y-4 max-w-md block">
                    <div className="p-4 bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl w-fit mx-auto shadow-md">
                      <FaUpload size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Bulk Resume Screening</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                        Drag and drop multiple applicant resumes (PDF, DOC, DOCX) here, or <span className="text-purple-500 font-bold hover:underline">browse files</span>.
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Screen and rank candidates automatically using NLP details.</span>
                  </label>
                )}
              </div>
            </div>

          </div>

          {/* CANDIDATE COMPARISON MATRIX */}
          {compareCandidates.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-5 animate-in zoom-in-95 duration-250">
              <div className="flex justify-between items-center border-b border-slate-200/30 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>⚖️</span> Candidate Unbiased Fairness Matrix
                </h3>
                <button
                  onClick={() => setCompareCandidates([])}
                  className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                >
                  Clear Comparison
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-250 dark:border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      <th className="pb-3 w-1/4">Evaluation Attribute</th>
                      {compareCandidates.map((candidate) => (
                        <th key={candidate.id} className="pb-3 px-4 w-1/4">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
                            <span className="text-slate-950 dark:text-white font-black">{candidate.candidate_name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs leading-relaxed">
                    
                    <tr className="hover:bg-slate-500/5">
                      <td className="py-4 font-bold text-slate-500">AI Compatibility Score</td>
                      {compareCandidates.map((candidate) => (
                        <td key={candidate.id} className="py-4 px-4 font-black">
                          <span className={`px-3 py-1 rounded-xl text-xs border font-black ${getScoreColor(candidate.ats_match_score)}`}>
                            {candidate.ats_match_score}%
                          </span>
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-500/5">
                      <td className="py-4 font-bold text-slate-500">Candidate Status</td>
                      {compareCandidates.map((candidate) => (
                        <td key={candidate.id} className="py-4 px-4 font-black">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusBadge(candidate.status)}`}>
                            {candidate.status}
                          </span>
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-500/5">
                      <td className="py-4 font-bold text-slate-500">Skills Alignment</td>
                      {compareCandidates.map((candidate) => (
                        <td key={candidate.id} className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {candidate.matched_skills?.slice(0, 8).map((s, idx) => (
                              <span key={idx} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-500/5">
                      <td className="py-4 font-bold text-slate-500">Key Gaps Found</td>
                      {compareCandidates.map((candidate) => (
                        <td key={candidate.id} className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {candidate.missing_skills?.slice(0, 8).map((s, idx) => (
                              <span key={idx} className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-500/5">
                      <td className="py-4 font-bold text-slate-500">Work Experience Summary</td>
                      {compareCandidates.map((candidate) => (
                        <td key={candidate.id} className="py-4 px-4 text-slate-750 dark:text-slate-300 font-medium">
                          {candidate.experience_summary}
                        </td>
                      ))}
                    </tr>

                    <tr className="hover:bg-slate-500/5">
                      <td className="py-4 font-bold text-slate-500">Education Match</td>
                      {compareCandidates.map((candidate) => (
                        <td key={candidate.id} className="py-4 px-4 text-slate-750 dark:text-slate-300 font-medium">
                          {candidate.education_match}
                        </td>
                      ))}
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CANDIDATE LEADERBOARD TABLE WITH ENHANCED SEARCH & FILTERS */}
          <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-5">
            
            {/* Header controls layout */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>🏆</span> Candidate Ranking Leaderboard
                </h3>
                <span className="text-slate-400 text-xs font-semibold">{filteredApplicants.length} Profiles Found</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search candidate name/skills/education */}
                <div className="relative flex-1 md:flex-initial">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"><FaSearch /></span>
                  <input
                    type="text"
                    placeholder="Name, skills, experience..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-52 pl-9 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2 text-xs outline-none focus:border-purple-500 font-semibold"
                  />
                </div>

                {/* Filter by Min ATS Score */}
                <div className="flex items-center gap-1">
                  <select
                    value={minScoreFilter}
                    onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                    className="bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-purple-500"
                  >
                    <option value={0}>All Scores</option>
                    <option value={80}>80%+ High Fit</option>
                    <option value={60}>60%+ Qualified</option>
                    <option value={40}>40%+ Under Review</option>
                  </select>
                </div>

                {/* Filter by Candidate status */}
                <div className="flex items-center gap-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-purple-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-1">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-purple-500"
                  >
                    <option value="score_desc">Score: High to Low</option>
                    <option value="score_asc">Score: Low to High</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredApplicants.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                No applicants match the current filters or search terms.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-3 w-16">Rank</th>
                      <th className="pb-3 w-1/4">Candidate Details</th>
                      <th className="pb-3 w-36">AI Score</th>
                      <th className="pb-3">Skills Alignment</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                    {filteredApplicants.map((applicant, index) => {
                      const isComparing = compareCandidates.some(c => c.id === applicant.id);
                      return (
                        <tr key={applicant.id} className="text-slate-700 dark:text-slate-350 hover:bg-slate-500/5 transition duration-200">
                          
                          {/* Rank number */}
                          <td className="py-4 font-black text-slate-950 dark:text-white">
                            {index + 1 === 1 ? "🥇 1" : index + 1 === 2 ? "🥈 2" : index + 1 === 3 ? "🥉 3" : `#${index + 1}`}
                          </td>

                          {/* Candidate basic info */}
                          <td className="py-4">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{applicant.candidate_name}</p>
                              <p className="text-slate-450 text-[10px] mt-0.5 font-medium">{applicant.candidate_email}</p>
                            </div>
                          </td>

                          {/* AI Score compatibility badge */}
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${getScoreColor(applicant.ats_match_score)}`}>
                                {applicant.ats_match_score}%
                              </span>
                              <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 hidden md:block overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-purple-500 to-indigo-650 h-1.5 rounded-full"
                                  style={{ width: `${applicant.ats_match_score}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Skills matched tag list */}
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {applicant.matched_skills?.slice(0, 3).map((s, i) => (
                                <span key={i} className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-350">
                                  {s}
                                </span>
                              ))}
                              {applicant.matched_skills?.length > 3 && (
                                <span className="text-[10px] text-slate-450 font-bold self-center">
                                  +{applicant.matched_skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Candidate workflow status */}
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getStatusBadge(applicant.status)}`}>
                              {applicant.status}
                            </span>
                          </td>

                          {/* Evaluator actions */}
                          <td className="py-4 text-right space-x-2">
                            {/* Schedule Interview Action */}
                            <button
                              onClick={() => handleOpenInterviewModal(applicant)}
                              className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 text-[9px] font-black uppercase transition cursor-pointer inline-flex items-center gap-1"
                              title="Schedule Interview"
                            >
                              <FaCalendarAlt /> Interview
                            </button>

                            {/* Shortlist/Reject Quick buttons */}
                            {applicant.status !== "Shortlisted" && (
                              <button
                                onClick={() => handleStatusChange(applicant.id, "Shortlisted")}
                                className="px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/20 text-[9px] font-black uppercase transition cursor-pointer"
                              >
                                Shortlist
                              </button>
                            )}
                            {applicant.status !== "Rejected" && (
                              <button
                                onClick={() => handleStatusChange(applicant.id, "Rejected")}
                                className="px-2 py-1 bg-red-550/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 text-[9px] font-black uppercase transition cursor-pointer"
                              >
                                Reject
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleComparison(applicant)}
                              className={`px-2 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider transition cursor-pointer ${
                                isComparing
                                  ? "bg-purple-650 text-white hover:bg-purple-700"
                                  : "border border-purple-500 text-purple-500 hover:bg-purple-500/5"
                              }`}
                            >
                              {isComparing ? "Comparing" : "Compare"}
                            </button>
                            
                            <button
                              onClick={() => setSelectedApplicant(applicant)}
                              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-black px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-750 transition text-[9px] uppercase tracking-wider cursor-pointer"
                            >
                              Details
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* RECRUITER ACTIVITY AUDIT LOGS MODAL / DRAWER */}
      {showActivityLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-250">
            <div className="flex justify-between items-center border-b border-slate-200/30 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <FaHistory className="text-purple-500" /> Recruiter Activity Audit Logs
              </h3>
              <button
                onClick={() => setShowActivityLogs(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-lg font-bold p-1 rounded-lg transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            {activityLogs.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">No recruiter activities recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-600 dark:text-purple-400 uppercase text-[10px] tracking-wider bg-purple-100/40 dark:bg-purple-950/40 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{log.details}</p>
                    <span className="text-[10px] text-slate-400">By: {log.recruiter_email}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowActivityLogs(false)}
                className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERVIEW SCHEDULING MODAL */}
      {interviewApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-250">
            <div className="flex justify-between items-center border-b border-slate-200/30 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <FaCalendarAlt className="text-purple-500" /> Schedule Interview
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Applicant: {interviewApplicant.candidate_name}</p>
              </div>
              <button
                onClick={() => setInterviewApplicant(null)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-lg font-bold p-1 rounded-lg transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveInterview} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={interviewData.date}
                    onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={interviewData.time}
                    onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Interview Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 font-semibold">
                    <input
                      type="radio"
                      name="mode"
                      value="Online"
                      checked={interviewData.mode === "Online"}
                      onChange={(e) => setInterviewData({ ...interviewData, mode: e.target.value })}
                    />
                    Online (Google Meet / Zoom)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 font-semibold">
                    <input
                      type="radio"
                      name="mode"
                      value="Offline"
                      checked={interviewData.mode === "Offline"}
                      onChange={(e) => setInterviewData({ ...interviewData, mode: e.target.value })}
                    />
                    Offline (In-Person Venue)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">
                  {interviewData.mode === "Online" ? "Meeting URL Link" : "Office Venue / Address"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={interviewData.mode === "Online" ? "https://meet.google.com/abc-defg-hij" : "Conference Room 3B, Tech Park"}
                  value={interviewData.link_or_venue}
                  onChange={(e) => setInterviewData({ ...interviewData, link_or_venue: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Instructions / Notes</label>
                <textarea
                  rows="3"
                  placeholder="Additional instructions for the candidate..."
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInterviewApplicant(null)}
                  className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={interviewLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-650 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-md"
                >
                  {interviewLoading ? "Scheduling..." : "Confirm Schedule & Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLICANT DETAIL MODAL OVERLAY */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-250">
            
            <div className="flex justify-between items-start border-b border-slate-200/30 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                  Candidate Screening Breakdown
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Objective Evaluation Analysis for {selectedApplicant.candidate_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-lg font-bold p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-200/50 dark:border-slate-800/80">
                <div className="relative flex items-center justify-center">
                  
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-purple-500"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - selectedApplicant.ats_match_score / 100)}
                    />
                  </svg>
                  
                  <div className="absolute text-center">
                    <span className="text-2xl font-black bg-gradient-to-r from-purple-500 to-indigo-650 bg-clip-text text-transparent">
                      {selectedApplicant.ats_match_score}%
                    </span>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Match</span>
                  </div>

                </div>
                
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-4">
                  Standard Objective Alignment
                </span>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Candidate Email</span>
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">{selectedApplicant.candidate_email}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Resume File Name</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-355 mt-1 flex items-center gap-1.5">
                    <FaFileAlt size={10} className="text-purple-500" />
                    {selectedApplicant.resume_filename}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Work History Alignment</span>
                  <p className="text-xs text-slate-650 dark:text-slate-300 mt-1 leading-relaxed">{selectedApplicant.experience_summary}</p>
                </div>
              </div>

            </div>

            <div className="space-y-4 border-t border-slate-100 dark:border-slate-850/60 pt-5">
              
              <div className="grid md:grid-cols-2 gap-4">
                
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                  <h4 className="font-bold text-emerald-600 dark:text-emerald-450 text-xs mb-3 flex items-center gap-1.5">
                    <FaCheckCircle /> Matched Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplicant.matched_skills?.map((s, idx) => (
                      <span key={idx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
                  <h4 className="font-bold text-red-650 dark:text-red-400 text-xs mb-3 flex items-center gap-1.5">
                    <FaExclamationCircle /> Missing Skill Gaps
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplicant.missing_skills?.map((s, idx) => (
                      <span key={idx} className="bg-red-500/10 text-red-650 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-850 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-2">🎓 Educational Verification Check</h4>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                  {selectedApplicant.education_match}
                </p>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-2xl">
                <h4 className="font-bold text-purple-600 dark:text-purple-400 text-xs mb-2 flex items-center gap-1.5">
                  <FaUserCheck /> Unbiased Screening Assessment
                </h4>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed italic">
                  {selectedApplicant.transparency_notes}
                </p>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-850/60 mt-4">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-md"
              >
                Close Insights
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default RecruiterDashboard;
