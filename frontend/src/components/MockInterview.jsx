import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaPlay, FaChevronRight, FaFilePdf, FaVolumeUp, FaClipboardCheck, FaRegLightbulb } from "react-icons/fa";

function MockInterview({ user }) {
  const [step, setStep] = useState("setup"); // setup, active, finished
  const [loading, setLoading] = useState(false);
  const [activeQIndex, setActiveQIndex] = useState(0);

  // Setup Form State
  const [setup, setSetup] = useState({
    job_role: "Software Engineer",
    experience_level: "Mid-Level",
    interview_type: "Technical",
    difficulty: "Medium",
  });

  const [questions, setQuestions] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [evalResult, setEvalResult] = useState(null);
  const [allQAs, setAllQAs] = useState([]);
  const [finalReport, setFinalReport] = useState(null);

  // Start Interview & Fetch 10 questions
  const handleStartInterview = async () => {
    try {
      setLoading(true);
      const res = await API.post("/tools/mock-interview/generate", setup);
      if (!res.data.questions || res.data.questions.length === 0) {
        toast.error("Failed to generate questions. Please try again.");
        return;
      }
      setQuestions(res.data.questions);
      setAllQAs([]);
      setActiveQIndex(0);
      setUserAnswer("");
      setEvalResult(null);
      setStep("active");
      toast.success("Interview started! Answer each question. 🚀");
    } catch (e) {
      console.error(e);
      toast.error("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Answer & Evaluate
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.warning("Please type your answer first.");
      return;
    }

    try {
      setLoading(true);
      const q = questions[activeQIndex];
      const res = await API.post("/tools/mock-interview/evaluate", {
        ...setup,
        question: q.question,
        user_answer: userAnswer,
      });

      setEvalResult(res.data);
      setAllQAs((prev) => [
        ...prev,
        {
          question: q.question,
          user_answer: userAnswer,
          score: res.data.score,
          feedback: res.data.feedback,
          better_answer: res.data.better_answer,
        },
      ]);
      toast.success("Answer evaluated! Check feedback. 🧠");
    } catch (e) {
      console.error(e);
      toast.error("Evaluation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Next Question or Finish
  const handleNextQuestion = async () => {
    if (activeQIndex < questions.length - 1) {
      setActiveQIndex((prev) => prev + 1);
      setUserAnswer("");
      setEvalResult(null);
    } else {
      // Last question completed, fetch final report
      try {
        setLoading(true);
        const res = await API.post("/tools/mock-interview/evaluate", {
          ...setup,
          question: "",
          user_answer: "",
          is_final: true,
          all_qas: allQAs,
        });
        setFinalReport(res.data.report);
        setStep("finished");
        toast.success("Mock Interview completed successfully! 🎓");
      } catch (e) {
        console.error(e);
        toast.error("Failed to generate final report.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Export Report PDF using printing
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
      
      {/* Dynamic Printing Rules for Interview Report */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-interview-report, #print-interview-report * {
            visibility: visible;
          }
          #print-interview-report {
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
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">AI Mock Interview Simulator</h2>
        <p className="text-slate-400 text-xs mt-1">Simulate premium interviews and evaluate answers on technical correctness, communication, and confidence.</p>
      </div>

      {/* STEP 1: Setup Form Screen */}
      {step === "setup" && (
        <div className="max-w-xl mx-auto space-y-6 py-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Target Job Role</label>
              <input
                type="text"
                value={setup.job_role}
                onChange={(e) => setSetup({ ...setup, job_role: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Experience Level</label>
              <select
                value={setup.experience_level}
                onChange={(e) => setSetup({ ...setup, experience_level: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm font-semibold"
              >
                <option value="Fresher / Entry-Level">Fresher / Entry-Level</option>
                <option value="Junior-Level">Junior-Level</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior-Level">Senior-Level</option>
                <option value="Lead / Managerial">Lead / Managerial</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Interview Type</label>
              <select
                value={setup.interview_type}
                onChange={(e) => setSetup({ ...setup, interview_type: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm font-semibold"
              >
                <option value="Technical">Technical Interview</option>
                <option value="HR">HR & Cultural Fit</option>
                <option value="Behavioral">Behavioral (STAR method)</option>
                <option value="Mixed">Mixed Rounds</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Difficulty</label>
              <select
                value={setup.difficulty}
                onChange={(e) => setSetup({ ...setup, difficulty: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm font-semibold"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-8"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FaPlay size={12} /> Start Mock Simulator
              </>
            )}
          </button>
        </div>
      )}

      {/* STEP 2: Active Interview Loop */}
      {step === "active" && questions.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Question & Answer Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 relative">
              <div className="absolute top-4 right-4 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-xl text-xs font-bold">
                Q {activeQIndex + 1} of {questions.length}
              </div>
              
              <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <FaVolumeUp /> Interviewer Question
              </h3>
              <p className="text-slate-850 dark:text-white font-bold text-base leading-relaxed">
                {questions[activeQIndex].question}
              </p>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                <FaClipboardCheck /> Your Answer (Use STAR layout if behavioral)
              </label>
              <textarea
                rows="6"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your structured answer here..."
                disabled={evalResult !== null}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl p-4 outline-none text-sm resize-none focus:border-purple-500 transition leading-relaxed"
              />
            </div>

            <div className="flex gap-4">
              {evalResult === null ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Submit Answer"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : activeQIndex === questions.length - 1 ? (
                    "Generate Interview Report"
                  ) : (
                    <>
                      Next Question <FaChevronRight size={10} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Real-time AI Evaluation Feedback sidebar */}
          <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-fit min-h-[300px]">
            {evalResult === null ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12 space-y-3">
                <FaRegLightbulb className="text-3xl text-purple-400 animate-bounce" />
                <p className="text-xs font-semibold max-w-[200px]">
                  Submit your answer to get live score & recommended feedback.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-850">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Answer score</span>
                  <div className="inline-block px-4.5 py-2.5 bg-purple-600 text-white rounded-2xl text-2xl font-black">
                    {evalResult.score}/100
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">AI Feedback</span>
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                    {evalResult.feedback}
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Improvement Tips</span>
                  <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {evalResult.tips?.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-850 pt-4">
                  <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest mb-1.5">Better Answer Model</span>
                  <p className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                    "{evalResult.better_answer}"
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* STEP 3: Final Report Screen */}
      {step === "finished" && finalReport && (
        <div id="print-interview-report" className="space-y-8 max-w-4xl mx-auto py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-3xl flex items-center justify-center text-2xl font-black">
                {finalReport.overall_score}%
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-850 dark:text-white">Overall Performance</h3>
                <p className="text-slate-400 text-xs mt-0.5">Mock Evaluation report for {setup.job_role}</p>
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow"
            >
              <FaFilePdf /> Download Report
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50/40 dark:bg-green-950/10 border border-green-150 dark:border-green-900/30 rounded-2xl p-6">
              <h4 className="font-bold text-green-700 dark:text-green-400 text-base mb-3">✅ Identified Strengths</h4>
              <ul className="space-y-2 text-slate-650 dark:text-slate-350 text-xs list-disc pl-4 leading-relaxed">
                {finalReport.strengths?.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50/40 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 rounded-2xl p-6">
              <h4 className="font-bold text-red-750 dark:text-red-400 text-base mb-3">❌ Areas for Correction</h4>
              <ul className="space-y-2 text-slate-650 dark:text-slate-350 text-xs list-disc pl-4 leading-relaxed">
                {finalReport.weaknesses?.map((wk, idx) => (
                  <li key={idx}>{wk}</li>
                ))}
              </ul>
            </div>

            <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-150 dark:border-indigo-900/30 rounded-2xl p-6 md:col-span-2">
              <h4 className="font-bold text-indigo-750 dark:text-indigo-400 text-base mb-3">💡 Development Recommendations</h4>
              <ul className="space-y-2 text-slate-650 dark:text-slate-350 text-xs list-disc pl-4 leading-relaxed">
                {finalReport.areas_to_improve?.map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* QA Summary history */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white text-lg">Interview Question History</h4>
            {allQAs.map((item, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h5 className="font-bold text-slate-800 dark:text-white text-sm pr-10 leading-relaxed">
                    Q{idx + 1}: {item.question}
                  </h5>
                  <span className="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-bold px-2 py-1 rounded">
                    Score: {item.score}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-slate-150 dark:border-slate-850">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Your Answer</span>
                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed italic">
                      "{item.user_answer}"
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider block mb-1">AI Recommendation</span>
                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                      {item.better_answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep("setup")}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-3.5 rounded-xl transition cursor-pointer"
          >
            Start Another Session
          </button>
        </div>
      )}

    </div>
  );
}

export default MockInterview;
