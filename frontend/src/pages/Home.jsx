import { useState } from "react";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import UploadCard from "../components/UploadCard";
import ResumePreview from "../components/ResumePreview";
import ResumeInsights from "../components/ResumeInsights";
import ATSCard from "../components/ATSCard";
import SkillsCard from "../components/SkillsCard";
import ChatBox from "../components/ChatBox";
import JDAnalyzer from "../components/JDAnalyzer";
import JDScoreCard from "../components/JDScoreCard";

function Home() {
  const [atsScore, setAtsScore] = useState(null);

  const [skills, setSkills] = useState([]);

  const [missingSkills, setMissingSkills] = useState([]);

  const [pdfUrl, setPdfUrl] = useState("");

  const [projectsCount, setProjectsCount] = useState(0);

  const [skillsCount, setSkillsCount] = useState(0);

  const [education, setEducation] = useState("Not Found");

  const [certificationsCount, setCertificationsCount] = useState(0);

  const [experience, setExperience] = useState("Fresher");

  const [matchScore, setMatchScore] = useState(0);

  const [matchedSkills, setMatchedSkills] = useState([]);

  const [jdMissingSkills, setJDMissingSkills] = useState([]);

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

    setMatchScore(0);
    setMatchedSkills([]);
    setJDMissingSkills([]);

    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <motion.div
          animate={{
            y: [0, 30, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 6,
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-purple-700 rounded-full blur-[160px] opacity-20"
        />

        <motion.div
          animate={{
            y: [0, -30, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-[160px] opacity-20"
        />
      </div>

      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
          }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-7xl font-extrabold leading-tight">
            AI Career
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}
              Assistant
            </span>
          </h1>

          <p className="text-slate-400 text-lg mt-6 max-w-3xl mx-auto">
            Analyze resumes, calculate ATS scores, identify missing skills and
            chat with your resume using Gemini AI + RAG.
          </p>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          className="mb-10"
        >
          <div className="grid lg:grid-cols-2 gap-6">
            <UploadCard
              setAtsScore={setAtsScore}
              setSkills={setSkills}
              setMissingSkills={setMissingSkills}
              setPdfUrl={setPdfUrl}
              setProjectsCount={setProjectsCount}
              setSkillsCount={setSkillsCount}
              setEducation={setEducation}
              setCertificationsCount={setCertificationsCount}
              setExperience={setExperience}
            />

            <ResumePreview pdfUrl={pdfUrl} />
          </div>

          {(pdfUrl || atsScore !== null) && (
            <ResumeInsights
              projectsCount={projectsCount}
              skillsCount={skillsCount}
              education={education}
              certificationsCount={certificationsCount}
              experience={experience}
            />
          )}

          {(pdfUrl || atsScore !== null) && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={clearResume}
                className="
                bg-red-600
                hover:bg-red-700
                px-6
                py-3
                rounded-xl
                font-semibold
                transition
                "
              >
                🗑 Clear Resume
              </button>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            whileHover={{
              scale: 1.03,
            }}
          >
            <ATSCard score={atsScore} />
          </motion.div>

          <motion.div
            whileHover={{
              scale: 1.01,
            }}
            className="lg:col-span-2"
          >
            <SkillsCard skills={skills} missingSkills={missingSkills} />
          </motion.div>
        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
          }}
          className="mt-10"
        >
          {/* JD Analyzer */}
          <JDAnalyzer
            setMatchScore={setMatchScore}
            setMatchedSkills={setMatchedSkills}
            setJDMissingSkills={setJDMissingSkills}
          />

          {matchScore > 0 && (
            <div className="mt-8 space-y-6">
              <JDScoreCard matchScore={matchScore} />

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-green-400">
                    ✅ Matched Skills
                  </h2>
                  {matchedSkills.length > 0 ? (
                    matchedSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="rounded-lg bg-slate-800 px-4 py-2 mb-2"
                      >
                        {skill}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400">
                      No matched skills found.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-red-400">
                    ❌ Missing Skills
                  </h2>
                  {jdMissingSkills.length > 0 ? (
                    jdMissingSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="rounded-lg bg-slate-800 px-4 py-2 mb-2"
                      >
                        {skill}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400">
                      No missing skills found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat */}
          <ChatBox resetTrigger={resetTrigger} />
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
