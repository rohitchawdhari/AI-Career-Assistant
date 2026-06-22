import UploadCard from "./UploadCard";
import ResumePreview from "./ResumePreview";
import ResumeInsights from "./ResumeInsights";
import { motion } from "framer-motion";

function Overview({
  pdfUrl,
  atsScore,
  projectsCount,
  skillsCount,
  education,
  certificationsCount,
  experience,
  setAtsScore,
  setSkills,
  setMissingSkills,
  setPdfUrl,
  setProjectsCount,
  setSkillsCount,
  setEducation,
  setCertificationsCount,
  setExperience,
  clearResume,
}) {
  return (
    <div className="space-y-8">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResumeInsights
            projectsCount={projectsCount}
            skillsCount={skillsCount}
            education={education}
            certificationsCount={certificationsCount}
            experience={experience}
          />

          <div className="mt-8 flex justify-center">
            <button
              onClick={clearResume}
              className="bg-red-550 hover:bg-red-600 dark:bg-red-950/40 border border-transparent dark:border-red-900/50 hover:dark:border-red-800 text-red-650 dark:text-red-400 px-6 py-3 rounded-xl font-bold transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-red-900/10 flex items-center gap-2"
            >
              🗑️ Clear Uploaded Resume
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Overview;
