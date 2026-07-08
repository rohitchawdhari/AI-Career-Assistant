import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaTrophy, FaStar, FaLightbulb, FaBriefcase, FaGraduationCap } from "react-icons/fa";

function CareerScorecard() {
  const [scoreData, setScoreData] = useState(null);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    fetchScorecard();
    fetchBadges();
  }, []);

  const fetchScorecard = async () => {
    try {
      const res = await API.get("/enterprise/career-score");
      setScoreData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await API.get("/enterprise/achievements");
      setBadges(res.data.badges || []);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      
      {scoreData && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main gauge score */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Career Readiness</h3>
            
            {/* Visual SVG Score Circle */}
            <div className="relative w-40 h-40 my-6 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" className="dark:stroke-slate-850" />
                <circle cx="80" cy="80" r="70" stroke="#8b5cf6" strokeWidth="12" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * scoreData.score) / 100} strokeLinecap="round" />
              </svg>
              <div>
                <span className="text-4xl font-black text-slate-850 dark:text-white block leading-none">{scoreData.score}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">Score / 100</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Consolidated readiness based on resume parses, mock interview runs, applications, and verified certifications.
            </p>
          </div>

          {/* Metrics breakdown & Suggestions list */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <FaLightbulb className="text-yellow-500" /> AI Suggestions to Improve Score
              </h4>
              
              <div className="space-y-3">
                {scoreData.suggestions?.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-850">
                    <span className="text-purple-600 dark:text-purple-400 font-black text-xs mt-0.5">#{idx + 1}</span>
                    <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats panel */}
            <div className="grid grid-cols-4 gap-4 mt-6 border-t border-slate-100 dark:border-slate-850 pt-5 text-center">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">ATS Score</span>
                <strong className="text-sm font-black text-slate-850 dark:text-white mt-0.5 block">{scoreData.ats_score}%</strong>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interviews</span>
                <strong className="text-sm font-black text-slate-850 dark:text-white mt-0.5 block">{scoreData.interview_score}%</strong>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Applied</span>
                <strong className="text-sm font-black text-slate-850 dark:text-white mt-0.5 block">{scoreData.applications}</strong>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Certs</span>
                <strong className="text-sm font-black text-slate-850 dark:text-white mt-0.5 block">{scoreData.certificates}</strong>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Gamified Achievements Badges grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <h3 className="text-base font-black text-slate-850 dark:text-white flex items-center gap-2">
          <FaTrophy className="text-purple-600 animate-bounce" /> Gamified Badges & Achievements
        </h3>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`border p-5 rounded-2xl text-center flex flex-col items-center justify-between gap-3 transition duration-350 ${
                badge.unlocked
                  ? "bg-purple-50/40 dark:bg-purple-950/20 border-purple-300 text-slate-800 dark:text-slate-100"
                  : "bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
              }`}
            >
              <div className={`p-4 rounded-full ${badge.unlocked ? 'bg-purple-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-850 text-slate-400'}`}>
                <FaStar size={24} className={badge.unlocked ? "animate-pulse" : ""} />
              </div>
              <div>
                <h4 className="font-black text-xs leading-none text-slate-900 dark:text-white">{badge.name}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1.5 leading-relaxed">{badge.description}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${badge.unlocked ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                {badge.unlocked ? "Unlocked" : "Locked"}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default CareerScorecard;
