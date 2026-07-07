import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaMoneyBillWave, FaChartLine, FaRegClock, FaGlobe, FaChevronRight, FaLightbulb, FaFilePdf } from "react-icons/fa";

function SalaryPredictor() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  // Form State
  const [form, setForm] = useState({
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    job_role: "Software Engineer",
    experience: "Mid-Level (3-5 years)",
    skills: "",
    education: "Bachelor's Degree",
    company_type: "Product Based",
    employment_type: "Full-Time",
  });

  const handlePredict = async () => {
    if (!form.job_role.trim()) {
      toast.warning("Please specify a Job Role.");
      return;
    }

    try {
      setLoading(true);
      const skillsArray = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await API.post("/tools/salary-predictor/predict", {
        ...form,
        skills: skillsArray.length > 0 ? skillsArray : ["Python", "JavaScript"],
      });
      setReport(res.data);
      toast.success("AI Salary Prediction generated! 💰");
    } catch (e) {
      console.error(e);
      toast.error("Salary prediction failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return "N/A";
    const currency = report?.currency || "INR";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);
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
          <FaMoneyBillWave className="text-emerald-500" /> AI Salary Predictor
        </h2>
        <p className="text-slate-400 text-xs mt-1">Predict packages based on location, experience depth, company product tier, and key tech stack competencies.</p>
      </div>

      {/* Input Form Setup */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 mb-8 space-y-4">
        
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-550 dark:text-slate-400 text-xs font-semibold mb-1">Country</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-550 dark:text-slate-400 text-xs font-semibold mb-1">State</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-550 dark:text-slate-400 text-xs font-semibold mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-550 dark:text-slate-400 text-xs font-semibold mb-1">Job Role</label>
            <input
              type="text"
              value={form.job_role}
              onChange={(e) => setForm({ ...form, job_role: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-550 dark:text-slate-400 text-xs font-semibold mb-1">Experience Tier</label>
            <select
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            >
              <option value="Entry-Level (0-2 years)">Entry-Level (0-2 years)</option>
              <option value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
              <option value="Senior-Level (6-9 years)">Senior-Level (6-9 years)</option>
              <option value="Lead / Architect (10+ years)">Lead / Architect (10+ years)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-550 dark:text-slate-400 text-xs font-semibold mb-1">Education Background</label>
            <input
              type="text"
              value={form.education}
              onChange={(e) => setForm({ ...form, education: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-slate-550 dark:text-slate-400 text-xs font-semibold mb-1">Key Skills (Comma separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="e.g. React, Node.js, Python, AWS"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-550 dark:text-slate-400 text-xs font-semibold mb-1">Company Type</label>
            <select
              value={form.company_type}
              onChange={(e) => setForm({ ...form, company_type: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            >
              <option value="Service Based">Service Based Corporation</option>
              <option value="Product Based">Product Based Startup/MNC</option>
              <option value="Unicorn Startup">Unicorn Tech Startup</option>
              <option value="FAANG / MAANG">MAANG Tiers</option>
            </select>
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer w-full text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Generate Salary Analysis"
          )}
        </button>

      </div>

      {/* Results View */}
      {report && (
        <div id="print-salary-report" className="space-y-8">
          
          {/* Main Range cards */}
          <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-850 rounded-3xl p-6">
            <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800 pb-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white">Estimated Annual Compensation</h3>
                <p className="text-slate-400 text-xs mt-0.5">Predicted package distribution for a {form.job_role}</p>
              </div>
              <button
                onClick={handlePrint}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <FaFilePdf /> Export PDF
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Minimum Package</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(report.min_salary)}</span>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl p-5 text-center shadow-lg shadow-purple-900/10">
                <span className="block text-[10px] text-purple-200 font-bold uppercase tracking-wider mb-1">Average Package</span>
                <span className="text-3xl font-black">{formatCurrency(report.avg_salary)}</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Maximum Package</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(report.max_salary)}</span>
              </div>

            </div>
          </div>

          {/* Market trends and career growth */}
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="bg-slate-50/55 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="font-bold text-slate-800 dark:text-white text-base mb-3 flex items-center gap-2">
                <FaChartLine className="text-purple-500" /> Market Compensation Trends
              </h4>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                {report.market_trends}
              </p>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800">
                <strong>Growth Potential:</strong> {report.growth_potential}
              </p>
            </div>

            <div className="bg-slate-50/55 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base mb-2.5 flex items-center gap-1.5">
                  🔥 Demand skills pills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {report.skill_demand?.map((s, idx) => (
                    <span key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base mb-2.5 flex items-center gap-1.5">
                  💎 Top Tier Paying Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {report.highest_paying_skills?.map((s, idx) => (
                    <span key={idx} className="bg-purple-100 dark:bg-purple-950/40 border border-purple-200/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* AI Career Advice */}
          <div className="bg-purple-50/40 dark:bg-purple-950/10 border border-purple-150 dark:border-purple-900/30 rounded-2xl p-6">
            <h4 className="font-bold text-purple-700 dark:text-purple-400 text-base mb-3 flex items-center gap-2">
              <FaLightbulb /> AI Negotiation & Career Guidance Advice
            </h4>
            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
              {report.career_advice}
            </p>
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
      #print-salary-report, #print-salary-report * {
        visibility: visible;
      }
      #print-salary-report {
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

export default SalaryPredictor;
