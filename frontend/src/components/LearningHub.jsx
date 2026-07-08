import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaGraduationCap, FaYoutube, FaBook, FaCheckSquare, FaListOl, FaGithub, FaFlagCheckered } from "react-icons/fa";

function LearningHub() {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);

  // Recommendations state
  const [resources, setResources] = useState(null);
  const [roadmap, setRoadmap] = useState(null);

  // Checkbox tracking state
  const [completedPhases, setCompletedPhases] = useState(new Set());

  const handleFetchResources = async (e) => {
    e.preventDefault();
    if (!role.trim() || !skills.trim()) {
      toast.warning("Please fill target role and core skills.");
      return;
    }

    try {
      setLoading(true);
      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      
      const [resHub, resRoadmap] = await Promise.all([
        API.post("/enterprise/learning-hub", { role: role.trim(), skills: skillList }),
        API.post("/enterprise/skill-gap-roadmap", { target_job: role.trim(), skills: skillList })
      ]);

      setResources(resHub.data);
      setRoadmap(resRoadmap.data);
      setCompletedPhases(new Set());
    } catch (err) {
      console.error(err);
      toast.error("Failed to compile learning curriculum.");
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (phaseKey) => {
    setCompletedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseKey)) next.delete(phaseKey);
      else next.add(phaseKey);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Target input panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-black text-slate-850 dark:text-white mb-5 flex items-center gap-2">
          🎓 AI Learning Hub & Roadmap Planner
        </h2>
        
        <form onSubmit={handleFetchResources} className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Target Job Role</label>
            <input
              type="text"
              placeholder="e.g. Cloud Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Your Skills (Comma separated)</label>
            <input
              type="text"
              placeholder="Python, Git, JavaScript"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? "Compiling Roadmap..." : "Generate Customized Roadmap"}
            </button>
          </div>
        </form>
      </div>

      {/* Curriculum breakdown */}
      {resources && roadmap && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left panel: Personalized study roadmaps */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
              <h3 className="text-base font-black text-slate-850 dark:text-white flex items-center gap-2">
                <FaListOl className="text-purple-500" /> 3-Phase Skill Gap Roadmap
              </h3>

              <div className="space-y-4 text-xs font-semibold">
                {[
                  { key: "phase1", name: "Phase 1: Foundations", text: roadmap.phase1 },
                  { key: "phase2", name: "Phase 2: Core Engineering", text: roadmap.phase2 },
                  { key: "phase3", name: "Phase 3: Deployment & Portfolio", text: roadmap.phase3 },
                ].map((phase) => (
                  <div
                    key={phase.key}
                    onClick={() => togglePhase(phase.key)}
                    className={`border rounded-2xl p-4 transition-all duration-350 cursor-pointer flex gap-4 items-start ${
                      completedPhases.has(phase.key)
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 text-slate-800 dark:text-slate-100"
                        : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-purple-300"
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg border shrink-0 ${completedPhases.has(phase.key) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}><FaCheckSquare size={12} /></span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{phase.name}</h4>
                      <p className="text-[11px] text-slate-550 dark:text-slate-450 mt-1.5 leading-relaxed">{phase.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Roadmap meta */}
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-850 pt-4 text-xs font-bold text-slate-400">
                <span>Estimated Completion: <strong className="text-purple-600 dark:text-purple-400">{roadmap.timeline || "8 Weeks"}</strong></span>
                <span>Difficulty: <strong className="text-cyan-500">{roadmap.difficulty || "Medium"}</strong></span>
              </div>
            </div>

            {/* Recommended projects & certifications */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg">
                <h4 className="font-bold text-slate-850 dark:text-white text-xs mb-3 flex items-center gap-1.5">
                  <FaFlagCheckered className="text-purple-500" /> Recommended Target Projects
                </h4>
                <ul className="text-xs text-slate-650 dark:text-slate-450 space-y-2 list-disc pl-4 leading-relaxed font-semibold">
                  {roadmap.projects?.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg">
                <h4 className="font-bold text-slate-850 dark:text-white text-xs mb-3 flex items-center gap-1.5">
                  <FaGraduationCap className="text-cyan-500" /> Target Certifications
                </h4>
                <ul className="text-xs text-slate-650 dark:text-slate-450 space-y-2 list-disc pl-4 leading-relaxed font-semibold">
                  {roadmap.certifications?.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* Right panel: Course Cards lists */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Courses links */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
              <h4 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider mb-2">Video Lectures & Interactive Classes</h4>
              
              <div className="space-y-3">
                {/* YouTube */}
                {resources.youtube?.map((y, idx) => (
                  <a key={idx} href={y.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl hover:border-red-400 transition text-xs font-bold text-slate-750 dark:text-slate-350">
                    <span className="p-2 bg-red-100 text-red-650 rounded-lg"><FaYoutube /></span>
                    <span className="truncate">{y.title}</span>
                  </a>
                ))}

                {/* Coursera */}
                {resources.coursera?.map((c, idx) => (
                  <a key={idx} href={c.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl hover:border-blue-400 transition text-xs font-bold text-slate-750 dark:text-slate-350">
                    <span className="p-2 bg-blue-100 text-blue-650 rounded-lg"><FaGraduationCap /></span>
                    <span className="truncate">{c.title}</span>
                  </a>
                ))}

                {/* Udemy */}
                {resources.udemy?.map((u, idx) => (
                  <a key={idx} href={u.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl hover:border-purple-400 transition text-xs font-bold text-slate-750 dark:text-slate-350">
                    <span className="p-2 bg-purple-100 text-purple-650 rounded-lg"><FaGraduationCap /></span>
                    <span className="truncate">{u.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Official documentation and repositories list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
              <h4 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider mb-2">Technical Guides & Source Repos</h4>

              <div className="space-y-3">
                {/* Official Docs */}
                {resources.documentation?.map((d, idx) => (
                  <a key={idx} href={d.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl hover:border-cyan-400 transition text-xs font-bold text-slate-750 dark:text-slate-350">
                    <span className="p-2 bg-cyan-100 text-cyan-600 rounded-lg"><FaBook /></span>
                    <span className="truncate">{d.name}</span>
                  </a>
                ))}

                {/* GitHub */}
                {resources.github?.map((g, idx) => (
                  <a key={idx} href={g.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl hover:border-slate-500 transition text-xs font-bold text-slate-750 dark:text-slate-350">
                    <span className="p-2 bg-slate-200 dark:bg-slate-850 text-slate-800 dark:text-white rounded-lg"><FaGithub /></span>
                    <span className="truncate">{g.name}</span>
                  </a>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

export default LearningHub;
