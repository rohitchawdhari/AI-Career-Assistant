import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaGithub, FaStar, FaUserFriends, FaExclamationTriangle, FaCheckCircle, FaFilePdf, FaBook } from "react-icons/fa";

function GithubAnalyzer() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleAnalyze = async () => {
    if (!username.trim()) {
      toast.warning("Please type a GitHub username first.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/tools/github-analyzer/analyze", { username });
      setReport(res.data);
      toast.success("GitHub portfolio analysis completed! 🐙");
    } catch (e) {
      console.error(e);
      const errDetail = e.response?.data?.detail || "Make sure the username is valid.";
      toast.error(`Analysis failed: ${errDetail}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
      
      {styleInject}

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <FaGithub /> GitHub Portfolio Analyzer
        </h2>
        <p className="text-slate-400 text-xs mt-1">Audit public GitHub projects for readme clarity, project diversity, licenses, and CI/CD pipelines.</p>
      </div>

      {/* Input Form */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 mb-8">
        <div className="relative flex-1">
          <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"><FaGithub /></span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="Enter GitHub username (e.g. torvalds)"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500 transition text-sm font-semibold"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-xl shadow transition shrink-0 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Analyze Profile"
          )}
        </button>
      </div>

      {/* Results View */}
      {report && (
        <div id="print-github-report" className="space-y-8">
          
          {/* Top Profile Card Summary */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-850 rounded-3xl p-6">
            <div className="flex items-center gap-4">
              {report.avatar_url && (
                <img
                  src={report.avatar_url}
                  alt={report.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                />
              )}
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{report.name}</h3>
                <p className="text-slate-450 dark:text-slate-400 text-xs mt-0.5 max-w-sm italic">
                  {report.bio || "No profile bio available."}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-550 dark:text-slate-400 mt-2 font-medium">
                  <span className="flex items-center gap-1"><FaUserFriends /> {report.followers} Followers</span>
                  <span className="flex items-center gap-1"><FaBook /> {report.public_repos} Repos</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Portfolio Score</span>
                <span className="text-3xl font-black bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  {report.score}/100
                </span>
              </div>
              <button
                onClick={handlePrint}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <FaFilePdf /> Export PDF
              </button>
            </div>
          </div>

          {/* Languages & Detailed Analysis Summary */}
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="md:col-span-2 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="font-bold text-slate-800 dark:text-white text-base mb-3">📋 Profile Evaluation</h4>
              <p className="text-slate-650 dark:text-slate-350 text-xs leading-relaxed">
                {report.summary}
              </p>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="font-bold text-slate-800 dark:text-white text-base mb-3">🛠️ Language Distribution</h4>
              <div className="space-y-3">
                {Object.entries(report.language_distribution || {}).map(([lang, pct]) => (
                  <div key={lang}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>{lang}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Specific warnings grid */}
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="bg-yellow-50/40 dark:bg-yellow-950/10 border border-yellow-150 dark:border-yellow-900/30 rounded-2xl p-5">
              <h5 className="font-bold text-yellow-750 dark:text-yellow-400 text-sm flex items-center gap-1.5 mb-2.5">
                <FaExclamationTriangle /> Inactive Repositories
              </h5>
              <ul className="text-xs text-slate-650 dark:text-slate-350 space-y-1.5 pl-4 list-disc">
                {report.inactive_repos?.map((repo, idx) => <li key={idx}>{repo}</li>)}
                {(!report.inactive_repos || report.inactive_repos.length === 0) && (
                  <span className="text-slate-400 italic">No inactive repos detected.</span>
                )}
              </ul>
            </div>

            <div className="bg-orange-50/45 dark:bg-orange-950/10 border border-orange-150 dark:border-orange-900/30 rounded-2xl p-5">
              <h5 className="font-bold text-orange-700 dark:text-orange-400 text-sm flex items-center gap-1.5 mb-2.5">
                <FaExclamationTriangle /> Missing Documentation
              </h5>
              <ul className="text-xs text-slate-650 dark:text-slate-350 space-y-1.5 pl-4 list-disc">
                {report.missing_documentation?.map((doc, idx) => <li key={idx}>{doc}</li>)}
                {(!report.missing_documentation || report.missing_documentation.length === 0) && (
                  <span className="text-slate-400 italic">All repos contain doc files.</span>
                )}
              </ul>
            </div>

            <div className="bg-red-50/45 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 rounded-2xl p-5">
              <h5 className="font-bold text-red-750 dark:text-red-400 text-sm flex items-center gap-1.5 mb-2.5">
                <FaExclamationTriangle /> Missing License Files
              </h5>
              <ul className="text-xs text-slate-650 dark:text-slate-350 space-y-1.5 pl-4 list-disc">
                {report.missing_licenses?.map((lic, idx) => <li key={idx}>{lic}</li>)}
                {(!report.missing_licenses || report.missing_licenses.length === 0) && (
                  <span className="text-slate-400 italic">License files verified in all.</span>
                )}
              </ul>
            </div>

          </div>

          {/* Suggestions Card */}
          <div className="bg-purple-50/40 dark:bg-purple-950/10 border border-purple-150 dark:border-purple-900/30 rounded-2xl p-6">
            <h4 className="font-bold text-purple-700 dark:text-purple-400 text-base mb-3 flex items-center gap-2">
              <FaCheckCircle /> Actionable Portfolio Checklist
            </h4>
            <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-350 pl-4 list-decimal leading-relaxed">
              {report.suggestions?.map((sug, idx) => (
                <li key={idx}>{sug}</li>
              ))}
            </ul>
          </div>

        </div>
      )}

    </div>
  );
}

const styleInject = (
  <style>{`
    @media print {
      body * {
        visibility: hidden;
      }
      #print-github-report, #print-github-report * {
        visibility: visible;
      }
      #print-github-report {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 0;
        background: white !important;
        color: black !important;
      }
    }
  `}</style>
);

export default GithubAnalyzer;
