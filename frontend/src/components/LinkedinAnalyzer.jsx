import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaLinkedin, FaTrophy, FaKey, FaChevronRight, FaLightbulb, FaFilePdf } from "react-icons/fa";

function LinkedinAnalyzer() {
  const [profileText, setProfileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleAnalyze = async () => {
    if (!profileText.trim()) {
      toast.warning("Please paste your LinkedIn profile contents first.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/tools/linkedin-analyzer/analyze", {
        profile_text: profileText,
      });
      setReport(res.data);
      toast.success("LinkedIn profile optimization analysis completed! 👔");
    } catch (e) {
      console.error(e);
      toast.error("LinkedIn analysis failed. Try again.");
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
          <FaLinkedin className="text-[#0077B5]" /> LinkedIn Profile Optimizer
        </h2>
        <p className="text-slate-400 text-xs mt-1">Audit headline visibility, about summary keywords, and experience clarity for recruiter outreach.</p>
      </div>

      {/* Paste Profile Box */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            Paste LinkedIn Profile Text (or PDF copy-paste details)
          </label>
          <textarea
            rows="7"
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            placeholder="Paste your LinkedIn Headline, About, Experience, and Skills details here..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-2xl p-4 outline-none text-sm resize-none focus:border-purple-500 transition leading-relaxed"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer w-full text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Analyze LinkedIn Profile"
          )}
        </button>
      </div>

      {/* Report view */}
      {report && (
        <div id="print-linkedin-report" className="space-y-8">
          
          {/* Top Score */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-850 rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-4.5 bg-purple-600 text-white rounded-2xl text-2xl font-black">
                {report.score}%
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white">Recruiter Visibility Score</h3>
                <p className="text-slate-400 text-xs mt-0.5">Profile compatibility rating for search algorithms</p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <FaFilePdf /> Export PDF
            </button>
          </div>

          {/* Alternative Headlines suggestions */}
          <div className="bg-slate-50/55 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h4 className="font-bold text-slate-800 dark:text-white text-base mb-3.5 flex items-center gap-2">
              💡 Recommended High-Visibility Headlines
            </h4>
            <div className="space-y-2.5">
              {report.headline_suggestions?.map((hl, idx) => (
                <div key={idx} className="flex gap-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3.5 items-center">
                  <span className="text-purple-600 dark:text-purple-400 font-black">#{idx + 1}</span>
                  <p className="text-slate-650 dark:text-slate-300 text-xs font-semibold">{hl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About Summary Optimization */}
          <div className="bg-slate-50/55 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h4 className="font-bold text-slate-800 dark:text-white text-base mb-2">📋 Optimized About Section</h4>
            <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider mb-3">Recruiter Friendly Bio Rewrite</p>
            <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-4.5 text-xs text-slate-650 dark:text-slate-300 leading-relaxed italic whitespace-pre-wrap">
              "{report.about_suggestions}"
            </div>
          </div>

          {/* Keywords and Tips grid */}
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="bg-slate-50/55 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="font-bold text-slate-800 dark:text-white text-base mb-3 flex items-center gap-1.5">
                <FaKey className="text-purple-500" /> Missing Search Keywords
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {report.missing_keywords?.map((kw, idx) => (
                  <span key={idx} className="bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-350 px-3 py-1.5 rounded-xl text-xs font-bold">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50/55 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="font-bold text-slate-800 dark:text-white text-base mb-3 flex items-center gap-1.5">
                <FaLightbulb className="text-purple-500" /> Profile Improvement Checklists
              </h4>
              <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-350 list-decimal pl-4 leading-relaxed">
                {report.recruiter_tips?.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
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
      #print-linkedin-report, #print-linkedin-report * {
        visibility: visible;
      }
      #print-linkedin-report {
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

export default LinkedinAnalyzer;
