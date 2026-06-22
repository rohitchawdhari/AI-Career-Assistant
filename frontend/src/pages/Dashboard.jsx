import { useState, useEffect } from "react";
import { FaHome, FaChartBar, FaBullseye, FaMagic, FaComments, FaWrench, FaHistory, FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import Overview from "../components/Overview";
import ATSCard from "../components/ATSCard";
import SkillsCard from "../components/SkillsCard";
import JDAnalyzer from "../components/JDAnalyzer";
import JDScoreCard from "../components/JDScoreCard";
import ChatBox from "../components/ChatBox";
import ResumeAIAssistant from "../components/ResumeAIAssistant";
import AICareerTools from "../components/AICareerTools";
import HistoryList from "../components/HistoryList";
import UserProfile from "../components/UserProfile";
import API from "../services/api";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Shared Upload/Resume States
  const [atsScore, setAtsScore] = useState(null);
  const [skills, setSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [projectsCount, setProjectsCount] = useState(0);
  const [skillsCount, setSkillsCount] = useState(0);
  const [education, setEducation] = useState("Not Found");
  const [certificationsCount, setCertificationsCount] = useState(0);
  const [experience, setExperience] = useState("Fresher");
  const [filename, setFilename] = useState("");

  // Advanced AI ATS States
  const [aiAtsLoading, setAiAtsLoading] = useState(false);
  const [aiAtsData, setAiAtsData] = useState(null);

  // JD Match States
  const [matchScore, setMatchScore] = useState(0);
  const [matchedSkills, setMatchedSkills] = useState([]);
  const [jdMissingSkills, setJDMissingSkills] = useState([]);
  const [keywordGaps, setKeywordGaps] = useState([]);
  const [jdSuggestions, setJdSuggestions] = useState([]);
  const [jdAiLoading, setJdAiLoading] = useState(false);

  const [resetTrigger, setResetTrigger] = useState(0);

  const clearResume = () => {
    setAtsScore(null);
    setSkills([]);
    setMissingSkills([]);
    setPdfUrl("");
    setProjectsCount(0);
    setSkillsCount(0);
    setEducation("Not Found");
    setCertificationsCount(0);
    setExperience("Fresher");
    setFilename("");
    setAiAtsData(null);
    setMatchScore(0);
    setMatchedSkills([]);
    setJDMissingSkills([]);
    setKeywordGaps([]);
    setJdSuggestions([]);
    setResetTrigger((prev) => prev + 1);
    toast.info("Uploaded resume data cleared.");
  };

  // Trigger Advanced AI ATS Analysis whenever a new resume is uploaded
  useEffect(() => {
    if (pdfUrl && !aiAtsData && !aiAtsLoading) {
      triggerAiAtsAnalysis();
    }
  }, [pdfUrl]);

  const triggerAiAtsAnalysis = async () => {
    try {
      setAiAtsLoading(true);
      const res = await API.post("/analyze-resume-ai");
      if (res.data.error) {
        console.error(res.data.error);
        return;
      }
      setAiAtsData(res.data);
      
      // Save to localStorage history
      saveToHistory({
        id: Math.random().toString(36).substring(2, 9),
        type: "ats",
        timestamp: Date.now(),
        filename: filename || "Resume",
        score: res.data.ats_score || atsScore || 50,
        details: res.data,
      });

    } catch (e) {
      console.error("Failed AI ATS Analysis", e);
    } finally {
      setAiAtsLoading(false);
    }
  };

  const saveToHistory = (item) => {
    const current = localStorage.getItem("career_history");
    let list = [];
    if (current) {
      try {
        list = JSON.parse(current);
      } catch (e) {
        list = [];
      }
    }
    list.push(item);
    localStorage.setItem("career_history", JSON.stringify(list));
  };

  const handleLoadHistoryItem = (item) => {
    if (item.type === "ats") {
      setAtsScore(item.score);
      setAiAtsData(item.details);
      // Mock basic details
      setFilename(item.filename);
      setPdfUrl("loaded_from_history");
      setActiveTab("ats");
      toast.success(`Loaded history for ${item.filename}`);
    } else {
      setMatchScore(item.score);
      setMatchedSkills(item.details.matched_skills || []);
      setJDMissingSkills(item.details.missing_skills || []);
      setKeywordGaps(item.details.keyword_gaps || []);
      setJdSuggestions(item.details.suggestions || []);
      setActiveTab("jd");
      toast.success(`Loaded Job Match analysis`);
    }
  };

  // Perform advanced AI job matching
  const handlePerformJDAiMatch = async (jdText) => {
    try {
      setJdAiLoading(true);
      const res = await API.post("/analyze-jd-ai", { job_description: jdText });
      if (res.data.error) {
        toast.error(res.data.error);
        return;
      }
      setMatchScore(res.data.match_score);
      setMatchedSkills(res.data.matched_skills || []);
      setJDMissingSkills(res.data.missing_skills || []);
      setKeywordGaps(res.data.keyword_gaps || []);
      setJdSuggestions(res.data.suggestions || []);

      // Log in history
      saveToHistory({
        id: Math.random().toString(36).substring(2, 9),
        type: "jd",
        timestamp: Date.now(),
        filename: "Job Match Alignment",
        score: res.data.match_score,
        details: res.data,
      });

      toast.success("AI job description match calculated! 🎯");
    } catch (e) {
      console.error(e);
      toast.error("AI matching failed. Standard keyword match loaded.");
    } finally {
      setJdAiLoading(false);
    }
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: <FaHome /> },
    { id: "ats", label: "ATS Analyzer", icon: <FaChartBar /> },
    { id: "jd", label: "Job Description Matcher", icon: <FaBullseye /> },
    { id: "assistant", label: "Resume AI Assistant", icon: <FaMagic /> },
    { id: "chat", label: "AI Career Coach", icon: <FaComments /> },
    { id: "tools", label: "AI Career Tools", icon: <FaWrench /> },
    { id: "history", label: "Analysis History", icon: <FaHistory /> },
    { id: "profile", label: "Profile Settings", icon: <FaUserCircle /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-black tracking-tight">
              AI Career{" "}
              <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 font-medium uppercase tracking-wider">
              Control Panel
            </p>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition duration-350 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/10"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-150 dark:border-slate-800 text-center text-xs text-slate-400">
          AI Career Copilot v2.0
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {activeTab === "overview" && (
          <Overview
            pdfUrl={pdfUrl}
            atsScore={atsScore}
            projectsCount={projectsCount}
            skillsCount={skillsCount}
            education={education}
            certificationsCount={certificationsCount}
            experience={experience}
            setAtsScore={(score) => {
              setAtsScore(score);
              // Store uploaded file name based on last uploaded file
              const uploadInput = document.querySelector('input[type="file"]');
              if (uploadInput && uploadInput.files && uploadInput.files[0]) {
                setFilename(uploadInput.files[0].name);
              }
            }}
            setSkills={setSkills}
            setMissingSkills={setMissingSkills}
            setPdfUrl={setPdfUrl}
            setProjectsCount={setProjectsCount}
            setSkillsCount={setSkillsCount}
            setEducation={setEducation}
            setCertificationsCount={setCertificationsCount}
            setExperience={setExperience}
            clearResume={clearResume}
          />
        )}

        {activeTab === "ats" && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ATSCard score={aiAtsData ? aiAtsData.ats_score : atsScore} />
              </div>
              <div className="lg:col-span-2">
                <SkillsCard skills={skills} missingSkills={missingSkills} />
              </div>
            </div>

            {/* AI Analyzer Card */}
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🤖 Advanced AI ATS Insights
              </h3>

              {aiAtsLoading && (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold">Gemini is evaluating your formatting, bullet points, and key skills...</p>
                </div>
              )}

              {!aiAtsLoading && !aiAtsData && (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm">Upload your resume in the Overview tab to load detailed AI evaluation reports.</p>
                </div>
              )}

              {aiAtsData && !aiAtsLoading && (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Strengths */}
                  <div className="bg-green-50/50 dark:bg-green-950/10 border border-green-150 dark:border-green-900/30 rounded-2xl p-6">
                    <h4 className="font-bold text-green-700 dark:text-green-400 text-lg mb-3">✅ Key Strengths</h4>
                    <ul className="space-y-2 text-slate-650 dark:text-slate-300 text-sm list-disc pl-4">
                      {aiAtsData.strengths?.map((str, idx) => (
                        <li key={idx} className="leading-relaxed">{str}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 rounded-2xl p-6">
                    <h4 className="font-bold text-red-750 dark:text-red-400 text-lg mb-3">❌ Structural Weaknesses</h4>
                    <ul className="space-y-2 text-slate-650 dark:text-slate-300 text-sm list-disc pl-4">
                      {aiAtsData.weaknesses?.map((wk, idx) => (
                        <li key={idx} className="leading-relaxed">{wk}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Keywords */}
                  <div className="bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-150 dark:border-yellow-900/30 rounded-2xl p-6 md:col-span-2">
                    <h4 className="font-bold text-yellow-750 dark:text-yellow-500 text-lg mb-3">⚠️ Missing Keywords & Competencies</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {aiAtsData.missing_keywords?.map((kw, idx) => (
                        <span key={idx} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                          {kw}
                        </span>
                      ))}
                      {(!aiAtsData.missing_keywords || aiAtsData.missing_keywords.length === 0) && (
                        <span className="text-slate-400 text-sm">No critical missing keywords reported.</span>
                      )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-150 dark:border-indigo-900/30 rounded-2xl p-6 md:col-span-2">
                    <h4 className="font-bold text-indigo-700 dark:text-indigo-400 text-lg mb-3">💡 Actionable Improvement Steps</h4>
                    <ul className="space-y-2.5 text-slate-650 dark:text-slate-300 text-sm list-decimal pl-4">
                      {aiAtsData.suggestions?.map((sug, idx) => (
                        <li key={idx} className="leading-relaxed">{sug}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "jd" && (
          <div className="space-y-8">
            <JDAnalyzer
              setMatchScore={setMatchScore}
              setMatchedSkills={setMatchedSkills}
              setJDMissingSkills={setJDMissingSkills}
              onPerformJDAiMatch={handlePerformJDAiMatch}
              loading={jdAiLoading}
            />

            {matchScore > 0 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <JDScoreCard matchScore={matchScore} />
                  </div>

                  <div className="md:col-span-2 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-4">Keyword Gap Analysis</h4>
                    <div className="flex flex-wrap gap-2">
                      {keywordGaps.map((gap, index) => (
                        <span
                          key={index}
                          className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 px-3.5 py-1.5 rounded-xl text-xs font-bold"
                        >
                          {gap}
                        </span>
                      ))}
                      {keywordGaps.length === 0 && (
                        <span className="text-slate-400 text-sm">No critical gaps calculated.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
                    <h2 className="text-xl font-bold mb-5 text-green-650 dark:text-green-400 flex items-center gap-2">
                      ✅ Matched Competencies
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {matchedSkills.length > 0 ? (
                        matchedSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-150 dark:border-slate-750 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <div className="text-slate-400 text-sm">No matched skills parsed.</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
                    <h2 className="text-xl font-bold mb-5 text-red-650 dark:text-red-400 flex items-center gap-2">
                      ❌ Missing Competencies
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {jdMissingSkills.length > 0 ? (
                        jdMissingSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-150 dark:border-slate-750 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <div className="text-slate-400 text-sm">No missing skills parsed.</div>
                      )}
                    </div>
                  </div>
                </div>

                {jdSuggestions.length > 0 && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-150 dark:border-indigo-900/30 rounded-3xl p-8 shadow-xl">
                    <h4 className="font-bold text-indigo-750 dark:text-indigo-400 text-lg mb-4">💡 Tailoring Recommendations</h4>
                    <ul className="space-y-2.5 text-slate-650 dark:text-slate-350 text-sm list-decimal pl-4">
                      {jdSuggestions.map((sug, idx) => (
                        <li key={idx} className="leading-relaxed">{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "assistant" && (
          <ResumeAIAssistant resumeUploaded={!!pdfUrl} />
        )}

        {activeTab === "chat" && (
          <ChatBox resetTrigger={resetTrigger} />
        )}

        {activeTab === "tools" && (
          <AICareerTools resumeUploaded={!!pdfUrl} />
        )}

        {activeTab === "history" && (
          <HistoryList onLoadItem={handleLoadHistoryItem} />
        )}

        {activeTab === "profile" && <UserProfile />}
      </main>
    </div>
  );
}

export default Dashboard;
