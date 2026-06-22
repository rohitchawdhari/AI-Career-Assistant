import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaMagic, FaDownload, FaCopy, FaCheckCircle } from "react-icons/fa";

function ResumeAIAssistant({ resumeUploaded }) {
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [improvedData, setImprovedData] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("summary");

  useEffect(() => {
    // Attempt to pre-fill targetRole from user profile
    const profile = localStorage.getItem("user_profile");
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        if (parsed.targetRole) {
          setTargetRole(parsed.targetRole);
        }
      } catch (e) {
        console.error("Error reading profile", e);
      }
    }
  }, []);

  const handleImprove = async () => {
    if (!resumeUploaded) {
      toast.warning("Please upload a resume in the Overview tab first.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/improve-resume", {
        target_role: targetRole || null,
      });

      if (res.data.error) {
        toast.error(res.data.error);
        return;
      }

      setImprovedData(res.data);
      toast.success("Resume optimized successfully! ✨");
    } catch (err) {
      console.error(err);
      toast.error("Failed to improve resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!improvedData || !improvedData.markdown_content) return;
    const blob = new Blob([improvedData.markdown_content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetRole.replace(/\s+/g, "_") || "Improved"}_Resume.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Markdown Resume downloaded! 📁");
  };

  const handleCopyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard! 📋");
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-all duration-300">
      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
          <FaMagic className="text-3xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Resume AI Optimizer</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Leverage Gemini AI to optimize, write impactful STAR bullet points, and polish summary statements.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">
            Target Job Role (Optional)
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 transition"
            placeholder="e.g. Senior Frontend Developer"
          />
        </div>
        <button
          onClick={handleImprove}
          disabled={loading}
          className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Rewriting Resume...
            </>
          ) : (
            <>
              <FaMagic />
              Optimize Resume
            </>
          )}
        </button>
      </div>

      {!improvedData ? (
        <div className="text-center py-12 text-slate-400">
          <FaMagic className="text-6xl mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <h3 className="text-xl font-bold mb-1">AI Optimizer Ready</h3>
          <p className="text-slate-500 text-sm">
            Configure a target job title above and click "Optimize Resume" to begin.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tabs Navigation & Suggestions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Resume Sections</h3>
              <div className="flex flex-col gap-2">
                {[
                  { id: "summary", label: "✨ Professional Summary" },
                  { id: "experience", label: "💼 Rewritten Work History" },
                  { id: "projects", label: "🚀 Impact Projects" },
                  { id: "skills", label: "🛠️ Skill Breakdown" },
                  { id: "markdown", label: "📝 View Full Resume (MD)" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                      activeSubTab === tab.id
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Optimization Suggestions */}
            {improvedData.suggestions && improvedData.suggestions.length > 0 && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5">
                <h3 className="font-bold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2">
                  <FaCheckCircle />
                  AI Optimization Tips
                </h3>
                <ul className="space-y-2.5 text-slate-600 dark:text-slate-300 text-sm list-disc pl-4 leading-relaxed">
                  {improvedData.suggestions.map((sug, idx) => (
                    <li key={idx}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Section Content Display */}
          <div className="lg:col-span-2 flex flex-col bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 min-h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-4 mb-4">
              <h3 className="text-xl font-bold capitalize text-slate-800 dark:text-white">
                {activeSubTab === "markdown" ? "Full Resume Markdown" : `${activeSubTab} Statement`}
              </h3>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleCopyToClipboard(
                      activeSubTab === "markdown"
                        ? improvedData.markdown_content
                        : activeSubTab === "summary"
                        ? improvedData.improved_summary
                        : activeSubTab === "experience"
                        ? improvedData.improved_experience
                        : activeSubTab === "projects"
                        ? improvedData.improved_projects
                        : improvedData.improved_skills
                    )
                  }
                  className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                >
                  <FaCopy size={12} />
                  Copy
                </button>

                {activeSubTab === "markdown" && (
                  <button
                    onClick={handleDownloadMarkdown}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-sm font-bold shadow transition"
                  >
                    <FaDownload size={12} />
                    Download MD
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto max-h-[500px]">
              {activeSubTab === "summary" && (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                  {improvedData.improved_summary}
                </p>
              )}

              {activeSubTab === "experience" && (
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                  {improvedData.improved_experience}
                </div>
              )}

              {activeSubTab === "projects" && (
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                  {improvedData.improved_projects}
                </div>
              )}

              {activeSubTab === "skills" && (
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                  {improvedData.improved_skills}
                </div>
              )}

              {activeSubTab === "markdown" && (
                <pre className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-sm leading-6 overflow-x-auto whitespace-pre-wrap">
                  {improvedData.markdown_content}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeAIAssistant;
