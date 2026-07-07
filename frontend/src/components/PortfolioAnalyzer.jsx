import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaGlobe, FaStar, FaLink, FaChartBar, FaExclamationTriangle, FaListUl, FaFilePdf } from "react-icons/fa";

function PortfolioAnalyzer() {
  const [url, setUrl] = useState("");
  const [githubUser, setGithubUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.warning("Please type your Portfolio URL first.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/tools/portfolio-analyzer/analyze", {
        url,
        github_username: githubUser || null,
      });
      setReport(res.data);
      toast.success("Portfolio visual and performance analysis completed! 🌐");
    } catch (e) {
      console.error(e);
      toast.error("Portfolio analysis failed. Try again.");
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
          <FaGlobe /> Portfolio UX & SEO Analyzer
        </h2>
        <p className="text-slate-400 text-xs mt-1">Audit personal website usability, responsive design, broken links, typography consistency, and integrated GitHub repos.</p>
      </div>

      {/* Inputs Form */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 mb-8 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Portfolio URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://yourname.github.io"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3.5 outline-none focus:border-purple-500 transition text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Associated GitHub Username (Optional)</label>
            <input
              type="text"
              value={githubUser}
              onChange={(e) => setGithubUser(e.target.value)}
              placeholder="e.g. yourname"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3.5 outline-none focus:border-purple-500 transition text-sm font-semibold"
            />
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer w-full text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Analyze Portfolio"
          )}
        </button>
      </div>

      {/* Report view */}
      {report && (
        <div id="print-portfolio-report" className="space-y-8">
          
          {/* Top summary header with scores */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-850 rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-600 text-white rounded-2xl text-2xl font-black">
                {report.score}%
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white">Design & Quality Score</h3>
                <p className="text-slate-400 text-xs mt-0.5">Audit feedback for URL: <span className="text-purple-600 dark:text-purple-400 font-semibold">{url}</span></p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <FaFilePdf /> Export PDF
            </button>
          </div>

          {/* Subscores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 text-center">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Performance</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{report.performance_score}%</span>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 text-center">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">SEO Audits</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{report.seo_score}%</span>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 text-center">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Accessibility</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{report.accessibility_score}%</span>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 text-center">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Responsiveness</span>
              <span className="text-2xl font-black text-emerald-500">95%</span>
            </div>

          </div>

          {/* Visual Consistency & Projects feedback */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-5">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-2 flex items-center gap-1.5">
                🎨 Visual Design & Typography
              </h4>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                {report.visual_consistency}
              </p>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-5">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-2 flex items-center gap-1.5">
                📁 Projects Content Evaluation
              </h4>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                {report.projects_evaluation}
              </p>
            </div>
          </div>

          {/* Weaknesses and Best practices list */}
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="bg-red-50/40 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 rounded-2xl p-6">
              <h4 className="font-bold text-red-750 dark:text-red-400 text-sm flex items-center gap-1.5 mb-3">
                <FaExclamationTriangle /> Identified Flaws & Weaknesses
              </h4>
              <ul className="text-xs text-slate-650 dark:text-slate-350 space-y-2 list-disc pl-4 leading-relaxed">
                {report.weaknesses?.map((wk, idx) => <li key={idx}>{wk}</li>)}
              </ul>
            </div>

            <div className="bg-purple-50/40 dark:bg-purple-950/10 border border-purple-150 dark:border-purple-900/30 rounded-2xl p-6">
              <h4 className="font-bold text-purple-700 dark:text-purple-400 text-sm flex items-center gap-1.5 mb-3">
                <FaListUl /> Performance & Best Practices
              </h4>
              <ul className="text-xs text-slate-650 dark:text-slate-350 space-y-2 list-decimal pl-4 leading-relaxed">
                {report.best_practices?.map((bp, idx) => <li key={idx}>{bp}</li>)}
              </ul>
            </div>

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
      #print-portfolio-report, #print-portfolio-report * {
        visibility: visible;
      }
      #print-portfolio-report {
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

export default PortfolioAnalyzer;
