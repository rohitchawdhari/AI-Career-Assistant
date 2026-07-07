import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaFilePdf, FaMagic, FaCalendarAlt, FaCheckCircle, FaListUl, FaLightbulb } from "react-icons/fa";

function WeeklyReports() {
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await API.get("/weekly-report");
      setReports(res.data.reports || []);
      if (res.data.reports && res.data.reports.length > 0) {
        setActiveReport(res.data.reports[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await API.post("/weekly-report/generate");
      if (res.data.status === "success") {
        toast.success("AI Weekly Report generated successfully! 📑");
        fetchReports();
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate weekly report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
      
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-weekly-report, #print-weekly-report * {
            visibility: visible;
          }
          #print-weekly-report {
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-850 dark:text-white flex items-center gap-2">
            📊 AI Weekly Progress Audit
          </h2>
          <p className="text-slate-450 dark:text-slate-400 text-xs mt-1">Automatically compile and generate audit reports evaluating resume improvements, job trackers, and learning progress.</p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 px-5 rounded-xl shadow flex items-center gap-2 cursor-pointer transition shrink-0"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><FaMagic /> Generate AI Report</>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Reports list Left sidebar */}
        <div className="lg:col-span-1 border-r border-slate-200 dark:border-slate-800 pr-4 space-y-2 max-h-[500px] overflow-y-auto">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Report History</span>
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeReport?.id === r.id
                  ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30"
                  : "bg-slate-50 dark:bg-slate-800/40 text-slate-650 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              <FaCalendarAlt />
              <span>{r.timestamp.slice(0, 10)}</span>
            </button>
          ))}
          {reports.length === 0 && (
            <div className="text-center text-slate-400 text-xs py-10">
              No reports compiled yet.
            </div>
          )}
        </div>

        {/* Report Content Right main panel */}
        <div className="lg:col-span-3">
          {activeReport ? (
            <div id="print-weekly-report" className="space-y-6">
              
              {/* Header metrics card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-850 rounded-2xl p-5">
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">AI Career Strategy Review</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mt-0.5">Compiled date: {activeReport.timestamp.slice(0,10)}</span>
                </div>
                <button
                  onClick={handlePrintPDF}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FaFilePdf /> Export PDF
                </button>
              </div>

              {/* Progress summaries */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4.5">
                  <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider mb-2">Resume Progress</span>
                  <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed italic">
                    "{activeReport.data.resume_progress}"
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4.5">
                  <span className="block text-[10px] text-cyan-500 font-bold uppercase tracking-wider mb-2">ATS Guidelines</span>
                  <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed italic">
                    "{activeReport.data.ats_improvement}"
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4.5">
                  <span className="block text-[10px] text-pink-500 font-bold uppercase tracking-wider mb-2">Applications Review</span>
                  <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed italic">
                    "{activeReport.data.job_applications_status}"
                  </p>
                </div>
              </div>

              {/* Skills Growth and course suggestions */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-2xl p-5">
                  <h4 className="font-bold text-slate-850 dark:text-white text-xs mb-3 flex items-center gap-1.5 uppercase">
                    <FaListUl className="text-purple-500" /> Recommended Skills to Study
                  </h4>
                  <ul className="text-xs text-slate-650 dark:text-slate-350 space-y-2 list-disc pl-4 leading-relaxed">
                    {activeReport.data.recommended_skills?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-2xl p-5">
                  <h4 className="font-bold text-slate-850 dark:text-white text-xs mb-3 flex items-center gap-1.5 uppercase">
                    <FaCheckCircle className="text-cyan-500" /> Recommended Courses & Certifications
                  </h4>
                  <ul className="text-xs text-slate-650 dark:text-slate-350 space-y-2 list-disc pl-4 leading-relaxed">
                    {activeReport.data.recommended_certs?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Project recommendations */}
              <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-2xl p-5">
                <h4 className="font-bold text-slate-850 dark:text-white text-xs mb-3 flex items-center gap-1.5 uppercase">
                  💡 Project Ideas to Build Portfolio
                </h4>
                <ul className="text-xs text-slate-650 dark:text-slate-350 space-y-2.5 list-decimal pl-4 leading-relaxed">
                  {activeReport.data.recommended_projects?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Career Strategy advise */}
              <div className="bg-purple-50/30 dark:bg-purple-950/10 border border-purple-150 dark:border-purple-900/30 rounded-2xl p-6">
                <h4 className="font-bold text-purple-700 dark:text-purple-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FaLightbulb /> AI Career Guidance Advice
                </h4>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                  {activeReport.data.career_advice}
                </p>
              </div>

              {/* Goals */}
              <div className="grid md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weekly Goals</span>
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed italic">
                    "{activeReport.data.goals?.weekly}"
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Monthly Goals</span>
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed italic">
                    "{activeReport.data.goals?.monthly}"
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
              <FaMagic className="text-3xl text-purple-400 animate-pulse mb-3" />
              <p className="text-xs font-semibold">Click 'Generate AI Report' to compile your first weekly career review audit.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default WeeklyReports;
