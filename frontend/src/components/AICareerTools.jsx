import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaFileSignature, FaQuestionCircle, FaRoute, FaDownload, FaCopy } from "react-icons/fa";

function AICareerTools({ resumeUploaded }) {
  const [activeTool, setActiveTool] = useState("coverletter");
  const [loading, setLoading] = useState(false);

  // States for cover letter
  const [jdText, setJdText] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  // States for interview questions
  const [interviewJd, setInterviewJd] = useState("");
  const [questions, setQuestions] = useState([]);

  // States for roadmap
  const [targetGoal, setTargetGoal] = useState("");
  const [roadmap, setRoadmap] = useState("");

  useEffect(() => {
    // Attempt to pre-fill targetGoal from user profile
    const profile = localStorage.getItem("user_profile");
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        if (parsed.targetRole) {
          setTargetGoal(parsed.targetRole);
        }
      } catch (e) {
        console.error("Error reading profile", e);
      }
    }
  }, []);

  const handleGenerateCoverLetter = async () => {
    if (!resumeUploaded) {
      toast.warning("Please upload your resume in the Overview tab first.");
      return;
    }
    if (!jdText.trim()) {
      toast.warning("Please paste a job description.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/generate-cover-letter", {
        job_description: jdText,
      });
      if (res.data.error) {
        toast.error(res.data.error);
        return;
      }
      setCoverLetter(res.data.cover_letter);
      toast.success("Cover letter generated! ✉️");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInterviewQuestions = async () => {
    if (!resumeUploaded) {
      toast.warning("Please upload your resume in the Overview tab first.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/generate-interview-questions", {
        job_description: interviewJd || null,
      });
      setQuestions(res.data.questions || []);
      toast.success("Interview questions tailored! 🧠");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!resumeUploaded) {
      toast.warning("Please upload your resume in the Overview tab first.");
      return;
    }
    if (!targetGoal.trim()) {
      toast.warning("Please specify a target career goal.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/generate-roadmap", {
        target_goal: targetGoal,
      });
      if (res.data.error) {
        toast.error(res.data.error);
        return;
      }
      setRoadmap(res.data.roadmap);
      toast.success("Career roadmap created! 🗺️");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard! 📋");
  };

  const handleDownloadTxt = (filename, text) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File downloaded! 📁");
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-all duration-300">
      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 mb-8">
        {[
          { id: "coverletter", label: "✉️ Cover Letter Generator", icon: <FaFileSignature /> },
          { id: "interview", label: "🧠 Interview simulator", icon: <FaQuestionCircle /> },
          { id: "roadmap", label: "🗺️ Career Roadmap Generator", icon: <FaRoute /> },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeTool === tool.id
                ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-900/10"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tool.icon}
            {tool.label}
          </button>
        ))}
      </div>

      {/* Cover Letter Section */}
      {activeTool === "coverletter" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Cover Letter Writer</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Paste the job description of the position you want to target. We'll build a matching pitch.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">
                Job Description
              </label>
              <textarea
                rows="10"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the Job Description here..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-4 outline-none focus:border-purple-500 transition resize-none flex-1 font-sans text-sm"
              />
              <button
                onClick={handleGenerateCoverLetter}
                disabled={loading}
                className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                {loading ? "Writing letter..." : "Write Cover Letter"}
              </button>
            </div>

            <div className="flex flex-col bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 min-h-[300px]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                <h4 className="font-bold text-slate-800 dark:text-white">Generated Letter</h4>
                {coverLetter && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyToClipboard(coverLetter)}
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 transition"
                      title="Copy Letter"
                    >
                      <FaCopy size={12} />
                    </button>
                    <button
                      onClick={() => handleDownloadTxt("Cover_Letter.txt", coverLetter)}
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 transition"
                      title="Download Cover Letter"
                    >
                      <FaDownload size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-h-[350px]">
                {coverLetter || (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Paste a Job Description and click generate.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview simulator Section */}
      {activeTool === "interview" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Interview Questions Prep</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Generate interview questions customized to your resume text and target description.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">
                  Job Description (Optional)
                </label>
                <textarea
                  rows="8"
                  value={interviewJd}
                  onChange={(e) => setInterviewJd(e.target.value)}
                  placeholder="Paste target role/JD to focus questions..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-4 outline-none focus:border-purple-500 transition resize-none text-sm"
                />
              </div>
              <button
                onClick={handleGenerateInterviewQuestions}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-xl shadow transition"
              >
                {loading ? "Generating Prep..." : "Generate Interview Questions"}
              </button>
            </div>

            <div className="md:col-span-2 space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {questions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-12">
                  Click generate to load QA cards.
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                    <h4 className="font-bold text-slate-800 dark:text-white text-base mb-2">
                      Q{idx + 1}: {q.question}
                    </h4>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 mt-3">
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider block mb-1">
                        AI Recommended Answer:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {q.answer}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roadmap Section */}
      {activeTool === "roadmap" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Career Roadmap Generator</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Define your final career milestone (e.g. Senior Solution Architect). We'll build a tailored curriculum.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">
                  Target Career Goal
                </label>
                <input
                  type="text"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  placeholder="e.g. Lead Machine Learning Engineer"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3.5 outline-none focus:border-purple-500 transition text-sm"
                />
              </div>
              <button
                onClick={handleGenerateRoadmap}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-xl shadow transition"
              >
                {loading ? "Generating Roadmap..." : "Generate Roadmap"}
              </button>
            </div>

            <div className="md:col-span-2 flex flex-col bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 min-h-[300px]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                <h4 className="font-bold text-slate-800 dark:text-white">Career Roadmap (Markdown)</h4>
                {roadmap && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyToClipboard(roadmap)}
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 transition"
                      title="Copy Roadmap"
                    >
                      <FaCopy size={12} />
                    </button>
                    <button
                      onClick={() => handleDownloadTxt("Career_Roadmap.md", roadmap)}
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 transition"
                      title="Download Roadmap"
                    >
                      <FaDownload size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-h-[350px]">
                {roadmap || (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Define a target role goal and click generate.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AICareerTools;
