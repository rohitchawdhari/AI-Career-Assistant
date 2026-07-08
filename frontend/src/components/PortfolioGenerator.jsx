import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaGlobe, FaPalette, FaDownload, FaCopy, FaCode } from "react-icons/fa";

function PortfolioGenerator() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [skills, setSkills] = useState("");
  const [theme, setTheme] = useState("Glassmorphism");
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !bio.trim()) {
      toast.warning("Name and Bio are required.");
      return;
    }

    try {
      setLoading(true);
      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await API.post("/enterprise/portfolio-generator/generate", {
        name: name.trim(),
        bio: bio.trim(),
        github_link: github.trim(),
        linkedin_link: linkedin.trim(),
        skills: skillList,
        theme: theme
      });

      if (res.data.status === "success") {
        setGeneratedHtml(res.data.html);
        toast.success("Portfolio source generated! 🌐");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate portfolio code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedHtml);
    toast.success("Source code copied to clipboard! 📋");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    toast.success("index.html downloaded successfully! 📁");
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Form controls */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 h-fit">
          <h3 className="text-base font-black text-slate-850 dark:text-white flex items-center gap-2">
            <FaPalette className="text-purple-600" /> Portfolio Site Config
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Display Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rohit Chawdhari"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Short Bio</label>
              <textarea
                rows="3"
                required
                placeholder="Brief professional summary..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs resize-none font-semibold leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Skills (Comma separated)</label>
              <input
                type="text"
                placeholder="React, FastAPI, Docker"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">GitHub Link</label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">LinkedIn Link</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Design Style Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-xl p-3 outline-none text-xs font-bold"
              >
                <option value="Glassmorphism">Glassmorphic Dark</option>
                <option value="Dark">Minimalistic Dark</option>
                <option value="Light">Professional Light</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? "Generating Site..." : <><FaGlobe /> Generate Portfolio Code</>}
            </button>
          </form>
        </div>

        {/* Right Code preview panel */}
        <div className="lg:col-span-2 space-y-6">
          {generatedHtml ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-4">
                <h4 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FaCode className="text-purple-600" /> Generated Source Preview (`index.html`)
                </h4>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:text-purple-600 rounded-xl border border-slate-200/50 dark:border-slate-750 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <FaCopy /> Copy Code
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <FaDownload /> Download File
                  </button>
                </div>
              </div>

              {/* Code viewer */}
              <div className="bg-slate-950 rounded-2xl p-4 overflow-x-auto max-h-[460px]">
                <pre className="text-[10px] text-cyan-400 font-mono leading-relaxed">
                  <code>{generatedHtml}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-32 border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl">
              <FaGlobe className="text-3xl text-purple-400 animate-pulse mb-3" />
              <p className="text-xs font-semibold">Provide your biography and social links to export a responsive portfolio site instantly.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default PortfolioGenerator;
