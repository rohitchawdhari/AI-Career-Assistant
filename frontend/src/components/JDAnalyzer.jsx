import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaUpload,
  FaCheckCircle,
  FaFilePdf,
  FaFileWord,
  FaPaste,
  FaMagic,
  FaDownload,
  FaClipboard,
  FaSpinner,
  FaTrashAlt,
  FaExclamationTriangle,
  FaRegLightbulb
} from "react-icons/fa";
import API from "../services/api";

function JDAnalyzer({
  user,
  resumeFilename,
  setResumeFilename,
  pdfUrl,
  setPdfUrl,
  matchScore,
  setMatchScore,
  matchedSkills,
  setMatchedSkills,
  jdMissingSkills,
  setJDMissingSkills,
  keywordGaps,
  setKeywordGaps,
  jdSuggestions,
  setJdSuggestions,
  setAtsScore,
  setSkills,
  setMissingSkills,
  setProjectsCount,
  setSkillsCount,
  setEducation,
  setCertificationsCount,
  setExperience
}) {
  // Input Options: "paste", "pdf", "docx"
  const [jdTab, setJdTab] = useState("paste");
  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState(null);
  
  // Loadings
  const [resumeLoading, setResumeLoading] = useState(false);
  const [jdLoading, setJdLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  
  // Results
  const [analysisResult, setAnalysisResult] = useState(null);
  const [optimizedData, setOptimizedData] = useState(null);

  // Parse Markdown to HTML for off-screen PDF capture and premium preview
  const parseMarkdownToHTML = (markdown) => {
    if (!markdown) return "";
    let html = markdown;
    // Strip bold markers
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Strip bullet markers
    html = html.replace(/^\*\s(.*)$/gm, "<li>$1</li>");
    html = html.replace(/^-\s(.*)$/gm, "<li>$1</li>");
    // Group adjacent li items into a ul tag
    html = html.replace(/(<li>.*<\/li>)/g, '<ul class="list-disc pl-5 my-2">$1</ul>');
    // Strip headers
    html = html.replace(/^###\s(.*)$/gm, '<h4 class="text-md font-bold mt-3 mb-1 text-slate-800 dark:text-slate-200">$1</h4>');
    html = html.replace(/^##\s(.*)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-slate-100">$1</h3>');
    html = html.replace(/^#\s(.*)$/gm, '<h2 class="text-xl font-black mt-5 mb-3 text-purple-650 dark:text-purple-400 border-b border-slate-200 dark:border-slate-800 pb-1">$1</h2>');
    // Line breaks
    html = html.replace(/\n/g, "<br/>");
    return html;
  };

  // Upload/Replace Resume Handler
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setResumeLoading(true);
      const res = await API.post("/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setAtsScore(res.data.ats_score);
      setSkills(res.data.skills_found || []);
      setMissingSkills(res.data.missing_skills || []);
      setProjectsCount(res.data.projects_count || 0);
      setSkillsCount(res.data.skills_count || 0);
      setEducation(res.data.education || "Not Found");
      setCertificationsCount(res.data.certifications_count || 0);
      setExperience(res.data.experience || "Fresher");
      
      setResumeFilename(file.name);
      setPdfUrl(res.data.file_url || "uploaded");
      toast.success("Resume uploaded successfully! 📄");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to upload resume.");
    } finally {
      setResumeLoading(false);
    }
  };

  // Upload Job Description File
  const handleJDFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setJdFile(file);
    const formData = new FormData();
    formData.append("file", file);

    try {
      setJdLoading(true);
      const res = await API.post("/extract-text", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setJobDescription(res.data.text || "");
      toast.success(`Job Description extracted from ${file.name}! 🎯`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to extract text from file.");
      setJdFile(null);
    } finally {
      setJdLoading(false);
    }
  };

  // Clear Resume Session
  const handleClearResume = () => {
    setResumeFilename("");
    setPdfUrl("");
    setAtsScore(null);
    setSkills([]);
    setMissingSkills([]);
    setAnalysisResult(null);
    setOptimizedData(null);
    toast.info("Active resume cleared.");
  };

  // Clear JD Input
  const handleClearJD = () => {
    setJobDescription("");
    setJdFile(null);
    setAnalysisResult(null);
    setOptimizedData(null);
    toast.info("Job Description input cleared.");
  };

  // Analyze Resume vs JD Handler
  const handleAnalyze = async () => {
    if (!resumeFilename || !pdfUrl) {
      toast.error("Please upload a resume first.");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Please provide a Job Description.");
      return;
    }

    try {
      setAnalyzeLoading(true);
      setAnalysisResult(null);
      setOptimizedData(null);

      const res = await API.post("/analyze-resume-jd", {
        job_description: jobDescription
      });

      setAnalysisResult(res);
      setMatchScore(res.data.ats_match_score || 50);
      setMatchedSkills(res.data.matching_skills || []);
      setJDMissingSkills(res.data.missing_skills || []);
      setKeywordGaps(res.data.missing_keywords || []);
      setJdSuggestions(res.data.suggestions?.missing_skills || []);

      toast.success("Comprehensive ATS engine analysis generated! 📊");
    } catch (err) {
      console.error(err);
      toast.error("Analysis failed. Please check backend connection.");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // Optimize Resume Handler
  const handleOptimize = async () => {
    if (!jobDescription.trim()) return;

    try {
      setOptimizeLoading(true);
      const res = await API.post("/optimize-resume", {
        job_description: jobDescription
      });
      setOptimizedData(res.data);
      toast.success("Resume optimized and tailored successfully! ⚡");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Optimization failed.");
    } finally {
      setOptimizeLoading(false);
    }
  };

  // Clipboard Copier
  const handleCopyToClipboard = () => {
    if (!optimizedData?.optimized_resume_markdown) return;
    navigator.clipboard.writeText(optimizedData.optimized_resume_markdown);
    toast.success("Optimized markdown copied to clipboard! 📋");
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    if (!optimizedData?.optimized_resume_markdown) return;
    const blob = new Blob([optimizedData.optimized_resume_markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Tailored_Resume_Optimized.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Markdown resume downloaded!");
  };

  // Download Word (.docx) file
  const handleDownloadDOCX = async () => {
    if (!optimizedData?.optimized_resume_markdown) return;
    try {
      const response = await API.post("/download-docx", {
        markdown: optimizedData.optimized_resume_markdown
      }, {
        responseType: "blob"
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "optimized_resume.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Word Document downloaded! 📝");
    } catch (err) {
      console.error("DOCX download failed:", err);
      toast.error("Failed to generate Word document.");
    }
  };

  // Dynamic loading of html2pdf and export to PDF
  const handleDownloadPDF = async () => {
    if (!optimizedData?.optimized_resume_markdown) return;
    toast.info("Generating PDF format...");

    const loadHtml2Pdf = () => {
      return new Promise((resolve) => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.onload = () => resolve(window.html2pdf);
        document.body.appendChild(script);
      });
    };

    try {
      const html2pdf = await loadHtml2Pdf();
      const element = document.getElementById("printable-resume-node");
      
      // Temporarily change styling for render capture
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: "Tailored_Resume_Optimized.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        toast.success("PDF Resume downloaded! 🎓");
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Could not capture PDF. Try printing manually.");
    }
  };

  // HSL Score Color Mapper
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10";
    if (score >= 60) return "text-yellow-500 border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/10";
    return "text-red-500 border-red-500/20 bg-red-50/50 dark:bg-red-950/10";
  };

  return (
    <div className="space-y-8">
      {/* 1. Resume and JD Setup Panel */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Active Resume Upload Status card */}
        <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-white">
              <span>📄</span> Active Resume Status
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Only one active resume can be compared against Job Descriptions at any time.
            </p>

            {resumeFilename ? (
              <div className="p-5 rounded-2xl bg-purple-50/30 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 flex items-start gap-4">
                <FaCheckCircle className="text-purple-500 text-xl shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                    {resumeFilename}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Factual details and parsed chunks are loaded into the active vector store index.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 flex items-start gap-4">
                <FaExclamationTriangle className="text-amber-500 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    No Resume Uploaded
                  </p>
                  <p className="text-xs text-slate-450 mt-1">
                    Upload your profile in PDF, DOC, or DOCX formats to start the comparisons.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            {resumeFilename ? (
              <>
                <label className="flex-1 flex justify-center items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-750 px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition">
                  <FaUpload />
                  Replace Resume
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={resumeLoading}
                  />
                </label>
                <button
                  onClick={handleClearResume}
                  className="p-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 rounded-xl cursor-pointer transition"
                  title="Clear resume"
                >
                  <FaTrashAlt />
                </button>
              </>
            ) : (
              <label className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-3.5 rounded-xl font-bold cursor-pointer transition shadow-lg shadow-purple-900/10">
                {resumeLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Parsing Resume...
                  </>
                ) : (
                  <>
                    <FaUpload />
                    Upload Resume
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={resumeLoading}
                />
              </label>
            )}
          </div>
        </div>

        {/* 2. Job Description Setup Card */}
        <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-white">
              <span>📋</span> Job Description Details
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Enter target requirements via paste, PDF, or Word file uploads.
            </p>

            {/* Input switcher tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-4 text-xs font-bold text-slate-400">
              <button
                onClick={() => setJdTab("paste")}
                className={`py-2 rounded-lg flex justify-center items-center gap-1.5 transition ${
                  jdTab === "paste" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <FaPaste /> Paste Text
              </button>
              <button
                onClick={() => setJdTab("pdf")}
                className={`py-2 rounded-lg flex justify-center items-center gap-1.5 transition ${
                  jdTab === "pdf" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <FaFilePdf /> Upload PDF
              </button>
              <button
                onClick={() => setJdTab("docx")}
                className={`py-2 rounded-lg flex justify-center items-center gap-1.5 transition ${
                  jdTab === "docx" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <FaFileWord /> Upload DOCX
              </button>
            </div>

            {/* Sub-inputs */}
            {jdTab === "paste" ? (
              <textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description details here..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 text-sm outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/85 text-slate-800 dark:text-white transition"
              />
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-950/20">
                {jdLoading ? (
                  <div className="py-4 space-y-2.5 text-slate-400">
                    <FaSpinner className="animate-spin text-2xl mx-auto text-purple-500" />
                    <p className="text-xs font-semibold">Extracting file text contents...</p>
                  </div>
                ) : jdFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FaCheckCircle className="text-green-500 text-3xl" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{jdFile.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Loaded successfully</p>
                  </div>
                ) : (
                  <label className="cursor-pointer group flex flex-col items-center gap-3">
                    <FaUpload className="text-3xl text-slate-400 group-hover:text-purple-400 transition" />
                    <div>
                      <p className="text-sm font-bold text-slate-650 dark:text-slate-300">
                        Click to upload JD {jdTab.toUpperCase()}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports only .{jdTab} files</p>
                    </div>
                    <input
                      type="file"
                      accept={jdTab === "pdf" ? ".pdf" : ".docx,.doc"}
                      onChange={handleJDFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            {(jobDescription.trim() || jdFile) && (
              <button
                onClick={handleClearJD}
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900/60 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-300 cursor-pointer transition"
              >
                Clear JD Input
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 3. Action Hub Banner */}
      <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-base">
            🚀 Ready to match alignment?
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Ensure both an active resume is uploaded and job description text is provided.
          </p>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={analyzeLoading || !resumeFilename || !jobDescription.trim()}
          className={`px-8 py-3.5 rounded-2xl font-bold cursor-pointer shadow-lg transition flex items-center gap-2.5 ${
            resumeFilename && jobDescription.trim()
              ? "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-900/10"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-750 cursor-not-allowed"
          }`}
        >
          {analyzeLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              Running Engine...
            </>
          ) : (
            "Analyze Resume vs JD"
          )}
        </button>
      </div>

      {/* 4. Complete ATS Scoring Result Panel */}
      {analysisResult && (
        <div className="space-y-6">
          
          {/* Main Gauges Row */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* ATS Match Score */}
            <div className={`rounded-3xl border p-6 flex flex-col items-center justify-center text-center shadow-xl ${getScoreColor(analysisResult.data.ats_match_score || 0)}`}>
              <h4 className="text-sm font-black uppercase tracking-wider mb-4">ATS Match Score</h4>
              <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-8 border-slate-100 dark:border-slate-900/80">
                <span className="text-4xl font-black tracking-tight">{analysisResult.data.ats_match_score || 0}%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold">
                Overlap alignment score determined by industry filters.
              </p>
            </div>

            {/* Resume Quality Score */}
            <div className={`rounded-3xl border p-6 flex flex-col items-center justify-center text-center shadow-xl ${getScoreColor(analysisResult.data.resume_score || 0)}`}>
              <h4 className="text-sm font-black uppercase tracking-wider mb-4">Resume Quality Score</h4>
              <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-8 border-slate-100 dark:border-slate-900/80">
                <span className="text-4xl font-black tracking-tight">{analysisResult.data.resume_score || 0}%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold">
                Standalone resume format, readability, and grammar quality.
              </p>
            </div>

            {/* Compatibility Score */}
            <div className={`rounded-3xl border p-6 flex flex-col items-center justify-center text-center shadow-xl ${getScoreColor(analysisResult.data.overall_compatibility_score || 0)}`}>
              <h4 className="text-sm font-black uppercase tracking-wider mb-4">Overall Compatibility</h4>
              <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-8 border-slate-100 dark:border-slate-900/80">
                <span className="text-4xl font-black tracking-tight">{analysisResult.data.overall_compatibility_score || 0}%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold">
                Holistic candidate fit index evaluated by senior recruiters.
              </p>
            </div>

          </div>

          {/* Core Matching Breakdowns */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Experience and Project Alignments */}
            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5">
              <h3 className="text-lg font-bold border-b border-slate-200/40 dark:border-slate-800 pb-2 mb-4 text-slate-800 dark:text-white">
                🛡️ Section Overlap Evaluations
              </h3>
              
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience Relevance:</span>
                <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed mt-1">
                  {analysisResult.data.experience_match || "No work history evaluation provided."}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Relevance:</span>
                <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed mt-1">
                  {analysisResult.data.project_match || "No projects evaluation provided."}
                </p>
              </div>
            </div>

            {/* Education and Certifications */}
            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5">
              <h3 className="text-lg font-bold border-b border-slate-200/40 dark:border-slate-800 pb-2 mb-4 text-slate-800 dark:text-white">
                🎓 Credentials Check
              </h3>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Education Match:</span>
                <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed mt-1">
                  {analysisResult.data.education_match || "No educational criteria check calculated."}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Certifications Alignment:</span>
                <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed mt-1">
                  {analysisResult.data.certification_match || "No certifications overlap evaluated."}
                </p>
              </div>
            </div>

          </div>

          {/* Matching Skills vs Missing Keywords grid */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Matched Competencies */}
            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
              <h4 className="font-bold text-green-700 dark:text-green-400 text-base mb-4 flex items-center gap-2">
                ✅ Matched Skills & Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.data.matching_skills?.map((sk, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/10 text-green-700 dark:text-green-400 text-xs font-bold">
                    {sk}
                  </span>
                ))}
                {(!analysisResult.data.matching_skills || analysisResult.data.matching_skills.length === 0) && (
                  <span className="text-slate-400 text-xs font-medium">No matched skills detected.</span>
                )}
              </div>
            </div>

            {/* Missing Competencies */}
            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
              <h4 className="font-bold text-red-650 dark:text-red-400 text-base mb-4 flex items-center gap-2">
                ❌ Missing Skills & Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.data.missing_skills?.map((sk, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 text-red-700 dark:text-red-400 text-xs font-bold">
                    {sk}
                  </span>
                ))}
                {(!analysisResult.data.missing_skills || analysisResult.data.missing_skills.length === 0) && (
                  <span className="text-slate-400 text-xs font-medium">All critical skills match.</span>
                )}
              </div>
            </div>

          </div>

          {/* AI suggestions Accordion structure */}
          <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
              <FaRegLightbulb className="text-yellow-500" />
              Recruiter Improvement Suggestions
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              
              {/* Weak sections */}
              <div className="space-y-4">
                <h5 className="font-bold text-sm text-slate-950 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1.5 uppercase tracking-wider text-xs">Structural Optimizations</h5>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4">
                  {analysisResult.data.suggestions?.weak_summary?.map((it, idx) => <li key={idx}>{it}</li>)}
                  {analysisResult.data.suggestions?.weak_experience?.map((it, idx) => <li key={idx}>{it}</li>)}
                  {analysisResult.data.suggestions?.weak_projects?.map((it, idx) => <li key={idx}>{it}</li>)}
                  {analysisResult.data.suggestions?.formatting_suggestions?.map((it, idx) => <li key={idx}>{it}</li>)}
                </ul>
              </div>

              {/* Keyword gaps */}
              <div className="space-y-4">
                <h5 className="font-bold text-sm text-slate-950 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1.5 uppercase tracking-wider text-xs">Missing Key terms</h5>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4">
                  {analysisResult.data.suggestions?.weak_keywords?.map((it, idx) => <li key={idx}>Inject: <strong>{it}</strong></li>)}
                  {analysisResult.data.suggestions?.missing_technologies?.map((it, idx) => <li key={idx}>Study/Include: <strong>{it}</strong></li>)}
                </ul>
              </div>

              {/* Action Verbs, achievements & grammar */}
              <div className="space-y-4">
                <h5 className="font-bold text-sm text-slate-950 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1.5 uppercase tracking-wider text-xs">Wording and Impact</h5>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4">
                  {analysisResult.data.suggestions?.action_verbs?.length > 0 && (
                    <li>Use verbs: {analysisResult.data.suggestions.action_verbs.slice(0, 5).join(", ")}</li>
                  )}
                  {analysisResult.data.suggestions?.weak_achievements?.map((it, idx) => <li key={idx}>{it}</li>)}
                  {analysisResult.data.suggestions?.grammar_improvements?.map((it, idx) => <li key={idx}>{it}</li>)}
                  {analysisResult.data.suggestions?.missing_certifications?.map((it, idx) => <li key={idx}>{it}</li>)}
                </ul>
              </div>

            </div>
          </div>

          {/* 5. Resume Optimizer CTA and loading */}
          <div className="p-8 rounded-3xl border border-purple-200 dark:border-purple-950 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaMagic className="text-purple-500" />
                Align Resume Automatically
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Let Gemini rewrite your summary, bullet points, skills, and projects based on the target Job Description. Facts, dates, and companies are never changed.
              </p>
            </div>
            
            <button
              onClick={handleOptimize}
              disabled={optimizeLoading}
              className="bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-550 text-white font-bold py-3.5 px-8 rounded-2xl cursor-pointer transition shadow-lg flex items-center gap-2"
            >
              {optimizeLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Optimizing Resume...
                </>
              ) : (
                <>
                  <FaMagic />
                  Generate AI Optimized Resume
                </>
              )}
            </button>
          </div>

          {/* 6. Comparison Section */}
          {optimizedData && (
            <div className="space-y-6">
              
              {/* Highlights score cards */}
              <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">🚀 Optimization Highlights</h3>
                
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  
                  <div className="p-5 rounded-2xl border border-purple-200 dark:border-purple-950/40 bg-purple-50/20 dark:bg-purple-950/10">
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-black block">Score Increase</span>
                    <h4 className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
                      +{optimizedData.estimated_ats_increase || 15}%
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      Estimated increase in parsing compatibility score.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl border border-emerald-250 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10 md:col-span-2">
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-black block">Added Keywords & Key terms</span>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {optimizedData.added_keywords?.map((kw, idx) => (
                        <span key={idx} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Side by Side Resume Text comparison columns */}
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Original Resume */}
                <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col">
                  <h4 className="text-base font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-250 dark:border-slate-800 flex justify-between items-center">
                    <span>🔴 Original Resume Content</span>
                  </h4>
                  <pre className="flex-1 whitespace-pre-wrap font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850 outline-none max-h-[500px] overflow-y-auto">
                    {optimizedData.original_resume || "Original text not parsed."}
                  </pre>
                </div>

                {/* Tailored Optimized Resume */}
                <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col">
                  <h4 className="text-base font-bold text-purple-600 dark:text-purple-400 mb-4 pb-2 border-b border-slate-250 dark:border-slate-800 flex justify-between items-center">
                    <span>🟢 Tailored Optimized Resume (Markdown)</span>
                  </h4>
                  <div className="flex-1 max-h-[500px] overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(optimizedData.optimized_resume_markdown) }}
                    />
                  </div>

                  {/* Off-screen container for high-fidelity PDF capture rendering */}
                  <div id="printable-resume-wrapper" className="hidden">
                    <div
                      id="printable-resume-node"
                      style={{
                        padding: "50px",
                        fontFamily: "Inter, Arial, sans-serif",
                        color: "#1e293b",
                        backgroundColor: "#ffffff",
                        lineHeight: "1.6",
                        fontSize: "12px"
                      }}
                      dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(optimizedData.optimized_resume_markdown) }}
                    />
                  </div>
                </div>

              </div>

              {/* Detailed rewrite before/after cards */}
              <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
                <h3 className="text-lg font-bold border-b border-slate-200/40 dark:border-slate-800 pb-2 mb-6 text-slate-800 dark:text-white">
                  ✍️ Bullet Points Rewrite Comparison (STAR format)
                </h3>
                
                <div className="space-y-4">
                  {optimizedData.improved_bullets?.map((bullet, idx) => (
                    <div key={idx} className="grid md:grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850/80 bg-slate-50/50 dark:bg-slate-950/20">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-red-500">Before</span>
                        <p className="text-xs text-slate-550 dark:text-slate-400 italic">"{bullet.before}"</p>
                      </div>
                      <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-250 dark:border-slate-800/85 pt-3 md:pt-0 md:pl-4">
                        <span className="text-[10px] font-black uppercase text-purple-500">Tailored Rewrite</span>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">"{bullet.after}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Panel toolbar options */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-100/50 dark:bg-slate-900/30 flex flex-wrap justify-between items-center gap-4 shadow-md">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">💾 Export tailordered document</h4>
                  <p className="text-[10px] text-slate-400">Save optimized formats to apply to job platforms.</p>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-2.5 px-4.5 rounded-xl text-xs font-bold cursor-pointer transition shadow"
                  >
                    <FaFilePdf /> PDF
                  </button>
                  <button
                    onClick={handleDownloadDOCX}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-2.5 px-4.5 rounded-xl text-xs font-bold cursor-pointer transition shadow"
                  >
                    <FaFileWord /> Word (DOCX)
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-850/80 text-white dark:bg-slate-800 dark:hover:bg-slate-700 py-2.5 px-4.5 rounded-xl text-xs font-bold cursor-pointer transition shadow"
                  >
                    <FaDownload /> Markdown (.md)
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-750 dark:bg-slate-850 dark:border-slate-750 dark:hover:bg-slate-800 dark:text-white py-2.5 px-4.5 rounded-xl text-xs font-bold cursor-pointer transition shadow"
                  >
                    <FaClipboard /> Copy to Clipboard
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default JDAnalyzer;