import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaChartLine, FaHistory, FaTools, FaFileCsv, FaFileExcel, FaFilePdf } from "react-icons/fa";

function AnalyticsDashboard() {
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const res = await API.get("/analytics/user-trends");
      setTrends(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load analytics trends");
    }
  };

  const handleExportCSV = () => {
    if (!trends) return;
    let csv = "Category,Metric/Score,Date/Attempt\n";
    trends.score_trends.forEach((t) => {
      csv += `Resume ATS,${t.score},${t.date}\n`;
    });
    trends.interview_trends.forEach((i) => {
      csv += `Interview Prep (${i.role}),${i.score},Attempt ${i.attempt}\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Career_Analytics_Report.csv";
    a.click();
    toast.success("CSV Report downloaded successfully!");
  };

  const handleExportExcel = () => {
    // Basic Excel XML format
    let excel = "sep=,\nCategory,Metric/Score,Date/Attempt\n";
    trends.score_trends.forEach((t) => {
      excel += `Resume ATS,${t.score},${t.date}\n`;
    });
    trends.interview_trends.forEach((i) => {
      excel += `Interview Prep (${i.role}),${i.score},Attempt ${i.attempt}\n`;
    });
    
    const blob = new Blob([excel], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Career_Analytics_Report.xls";
    a.click();
    toast.success("Excel Report downloaded!");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      
      {/* Print stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-analytics-dashboard, #print-analytics-dashboard * {
            visibility: visible;
          }
          #print-analytics-dashboard {
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

      {/* Header & Export options */}
      <div id="print-analytics-dashboard" className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-3xl p-5">
          <div>
            <h2 className="text-xl font-black text-slate-850 dark:text-white flex items-center gap-2">
              <FaChartLine className="text-purple-600" /> Career Analytics & Trends
            </h2>
            <p className="text-slate-400 text-xs mt-1">Real-time statistics on resume improvements, mock scores, and tools usage logs.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-750"
            >
              <FaFileCsv /> CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-750"
            >
              <FaFileExcel /> Excel
            </button>
            <button
              onClick={handlePrintPDF}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <FaFilePdf /> Export PDF
            </button>
          </div>
        </div>

        {trends && (
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Chart 1: Resume ATS Score Trend */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-5">📈 Resume ATS Score Trend</h4>
              
              {/* Premium SVG Line Chart */}
              <div className="relative w-full h-48 bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 flex items-end">
                <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <path
                    d={`M ${trends.score_trends.map((t, idx) => `${(idx / (trends.score_trends.length - 1 || 1)) * 300}, ${100 - t.score}`).join(" L ")}`}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {trends.score_trends.map((t, idx) => (
                    <circle
                      key={idx}
                      cx={(idx / (trends.score_trends.length - 1 || 1)) * 300}
                      cy={100 - t.score}
                      r="4"
                      fill="#06B6D4"
                    />
                  ))}
                </svg>
                <div className="flex justify-between w-full text-[9px] text-slate-400 font-bold border-t border-slate-200 dark:border-slate-800 pt-2 z-10">
                  {trends.score_trends.map((t, idx) => (
                    <span key={idx}>{t.date.slice(5)}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 2: Mock Interview Progress */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-5">🧠 Mock Interview Scores Trend</h4>
              
              {/* Premium SVG Bar Chart */}
              <div className="relative w-full h-48 bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 flex items-end">
                <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 300 100" preserveAspectRatio="none">
                  {trends.interview_trends.map((item, idx) => {
                    const x = (idx / (trends.interview_trends.length || 1)) * 300 + 15;
                    const barHeight = item.score;
                    return (
                      <g key={idx}>
                        <rect
                          x={x}
                          y={100 - barHeight}
                          width="24"
                          height={barHeight}
                          fill="url(#barGradient)"
                          rx="4"
                        />
                        <text x={x + 12} y={95 - barHeight} textAnchor="middle" fill="#8B5CF6" fontSize="8" fontWeight="bold">
                          {item.score}%
                        </text>
                      </g>
                    );
                  })}
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex justify-between w-full text-[9px] text-slate-400 font-bold border-t border-slate-200 dark:border-slate-800 pt-2 z-10 px-4">
                  {trends.interview_trends.map((item, idx) => (
                    <span key={idx}>Try {item.attempt}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Skill Progression Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-5 flex items-center gap-1.5">
                <FaTools className="text-cyan-500" /> Core Engineering Skills Growth
              </h4>
              <div className="space-y-4 text-xs font-semibold">
                {[
                  { skill: "Python (FastAPI, Flask)", level: 85, color: "bg-purple-600" },
                  { skill: "JavaScript (React, Node)", level: 75, color: "bg-cyan-500" },
                  { skill: "Database (MongoDB, SQL)", level: 80, color: "bg-emerald-500" },
                  { skill: "DevOps & Cloud (Docker, AWS)", level: 60, color: "bg-yellow-500" },
                ].map((s) => (
                  <div key={s.skill}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-750 dark:text-slate-350">{s.skill}</span>
                      <span className="text-slate-400">{s.level}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`${s.color} h-full rounded-full`} style={{ width: `${s.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Timeline Activities */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-5 flex items-center gap-1.5">
                <FaHistory className="text-pink-500" /> Activity Timeline Logs
              </h4>
              <div className="space-y-4 max-h-[190px] overflow-y-auto pr-1">
                {trends.timeline?.map((item) => (
                  <div key={item.id} className="flex gap-4 border-l-2 border-slate-200 dark:border-slate-800 pl-4 relative text-xs">
                    <div className="absolute -left-1.5 top-1 w-3 h-3 bg-purple-600 rounded-full border-2 border-white dark:border-slate-900" />
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-white">{item.title}</h5>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{item.date}</span>
                    </div>
                  </div>
                ))}
                {(!trends.timeline || trends.timeline.length === 0) && (
                  <div className="text-center text-slate-400 text-xs py-8">
                    No activity logs reported yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}

export default AnalyticsDashboard;
